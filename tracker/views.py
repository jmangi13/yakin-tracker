"""
views.py

URL route handlers
"""

from flask import request, Response, abort, render_template, session, redirect, url_for
from flask.ext.login import LoginManager, login_required, logout_user, login_user, current_user
from pykml import parser
from datetime import datetime
from google.appengine.runtime.apiproxy_errors import CapabilityDisabledError
from google.appengine.ext.db import BadValueError
from google.appengine.ext import ndb
import urllib2
import time
import json
import logging
import delorme
import hashlib, uuid

from models import Point, Config, User
from forms import LoginForm

from tracker import app

login_manager = LoginManager()
login_manager.init_app(app)

@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/admin/')
@login_required
def admin():
    return app.send_static_file('admin/index.html')


@login_manager.user_loader
def user_loader(user_id):
    """Given *user_id*, return the associated User object.

    :param unicode user_id: user_id (email) user to retrieve
    """
    return User.get_by_id(user_id)


@login_manager.unauthorized_handler
def unauthorized():
    return redirect(url_for("login"))


@app.errorhandler(404)
def page_not_found(e):
	"""Return a custom 404 error."""
	return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
def page_not_found(e):
	"""Return a custom 500 error."""
	return 'Sorry, unexpected error: {}'.format(e), 500


@app.route("/_ah/warmup")
def warmup():
	return ''

@app.route('/api/v1/point/route/load', methods=['POST'])
@login_required
def load_route():
    try:
        data = json.loads(request.data)
        url = data['url']
    except Exception as e:
        logging.error(e.args[0])
        abort(400)

    obj = urllib2.urlopen(url)
    str = obj.read()
    kml_str = ""
    for line in iter(str.splitlines()):
        if not 'atom:link' in line:
            kml_str+=line
            kml_str+='\n'

    Point.delete_all('route')

    root = parser.fromstring(kml_str)

    pointid = 1000
    for placemark in root.Document.Folder.Placemark:
        coordinates = placemark.MultiGeometry.Point.coordinates.text.split(',')
        try:
            point = Point(
                title = placemark.name.text,
                type = 'route',
                latitude = float(coordinates[1]),
                longitude = float(coordinates[0]),
                pointid = pointid,
                timestamp = datetime.now()
            )
        except TypeError:
            abort(500)
        except Exception as e:
            logging.error(e.args[0])
            abort(500)
        try:
            point.put()
        except CapabilityDisabledError:
            logging.error(u'App Engine Datastore is currently in read-only mode.')
            abort(500)
        except Exception as e:
            logging.error(e.args[0])
            abort(500)

        pointid += 1

    return list_point('route')

@app.route('/api/v1/point/<type>', methods=['GET'])
def list_point(type):
    points_dict = []
    points = Point.query(Point.type == type).order(Point.timestamp, Point.pointid).fetch()
    for point in points:
        points_dict.append(point.to_dict())

    return Response(json.dumps(points_dict), mimetype='application/json');


@app.route('/api/v1/point/<type>/<id>', methods=['GET'])
def get_point(type, id):
    point = Point.get_by_id(int(id))
    return Response(json.dumps(point.to_dict()), mimetype='application/json');


@app.route('/api/v1/point/<type>/<id>', methods=['PUT'])
@login_required
def update_point(type, id):
    point = Point.get_by_id(int(id))

    try:
        data = json.loads(request.data)

        if 'title' in data:
            point.title = data['title']

        if 'latitude' in data:
            point.latitude = float(data['latitude'])

        if 'longitude' in data:
            point.longitude = float(data['longitude'])

        if 'desc' in data:
            point.desc = data['desc']

        if 'resource' in data:
            point.resource = data['resource']

        if 'timestamp' in data:
            point.timestamp = datetime.strptime(data['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")

        point.put()
    except CapabilityDisabledError:
        logging.error(u'App Engine Datastore is currently in read-only mode.')
        abort(500)
    except Exception as e:
        logging.error(e.args[0])
        abort(500)

    return Response(json.dumps(point.to_dict()), mimetype='application/json');


@app.route('/api/v1/point/<type>', methods=['POST'])
@login_required
def add_point(type):
    try:
        data = json.loads(request.data)

        title = None
        if 'title' in data:
            title = data['title']

        if 'latitude' in data:
            latitude = float(data['latitude'])
        else:
            abort(400)

        if 'longitude' in data:
            longitude = float(data['longitude'])
        else:
            abort(400)

        desc = None
        if 'desc' in data:
            desc = data['desc']

        resource = None
        if 'resource' in data:
            resource = data['resource']

        timestamp = datetime.now()
        if 'timestamp' in data:
            timestamp = datetime.strptime(data['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")

        point = Point(
            title=title,
            latitude=latitude,
            longitude=longitude,
            desc=desc,
            resource=resource,
            timestamp=timestamp,
            type=type
        )

        point.put()
    except CapabilityDisabledError:
        logging.error(u'App Engine Datastore is currently in read-only mode.')
        abort(500)
    except BadValueError:
        abort(400)
    except TypeError:
        abort(400)
    except Exception as e:
        logging.error(e.args[0])
        abort(500)

    return Response(json.dumps(point.to_dict()), mimetype='application/json');


@app.route('/api/v1/point/<type>/<id>', methods=['DELETE'])
@login_required
def delete_point(type, id):
    point = Point.get_by_id(int(id))
    try:
        point.key.delete()
    except CapabilityDisabledError:
        logging.error(u'App Engine Datastore is currently in read-only mode.')
        abort(500)
    except Exception as e:
        logging.error(e.args[0])
        abort(500)

    return Response(json.dumps({ 'status': 'ok' }), mimetype='application/json');


@app.route('/api/v1/config/<name>', methods=['GET'])
@login_required
def get_config(name):
    config = Config.query(Config.name == name).order(-Config.date_added).get()
    if config is not None:
        return Response(json.dumps(config.to_dict()), mimetype='application/json');
    else:
        return Response(json.dumps({ 'error': 'configuration was not found.' }), status=400, mimetype='application/json');


@app.route('/api/v1/config', methods=['POST'])
@login_required
def save_config():
    try:
        data = json.loads(request.data)
        name = data['name']
        value = data['value']
        config = Config(
            name=name,
            value=value
        )
        config.put()
    except CapabilityDisabledError:
        logging.error(u'App Engine Datastore is currently in read-only mode.')
        abort(500)
    except BadValueError:
        abort(400)
    except TypeError:
        abort(400)
    except Exception as e:
        logging.error(e.args[0])
        abort(500)

    return Response(json.dumps(config.to_dict()), mimetype='application/json');


@app.route('/api/v1/point/tracker/load', methods=['GET'])
def load_tracker():
    tracker_url = Config.query(Config.name == 'tracker_url').order(-Config.date_added).get()
    if tracker_url is None:
        return Response(json.dumps({ 'error': 'tracker_url configuration was not found.' }), status=500, mimetype='application/json');

    tracker_type = Config.query(Config.name == 'tracker_type').order(-Config.date_added).get()
    if tracker_type is None:
        return Response(json.dumps({ 'error': 'tracker_type configuration was not found.' }), status=500, mimetype='application/json');

    if tracker_type.value == 'delorme':
        return delorme.load_data(tracker_url.value)
    elif tracker_type.value == 'spot':
        return Response(json.dumps({ 'error': 'tracker not supported.' }), status=400, mimetype='application/json');
    else:
        return Response(json.dumps({ 'error': 'tracker not supported.' }), status=400, mimetype='application/json');


@app.route('/api/v1/user', methods=['POST'])
@login_required
def add_user():
    try:
        data = json.loads(request.data)
        email = data['email']
        password = data['password']
        salt = uuid.uuid4().hex
        hashed_password = hashlib.sha512(password + salt).hexdigest()
        user = User(
            email=email,
            password=hashed_password,
            salt=salt
        )
        user.key = ndb.Key(User, email)
        user.put()
    except CapabilityDisabledError:
        logging.error(u'App Engine Datastore is currently in read-only mode.')
        abort(500)
    except BadValueError:
        abort(400)
    except TypeError:
        abort(400)
    except Exception as e:
        logging.error(e.args[0])
        abort(500)

    return Response(json.dumps({ "status": "ok" }), mimetype='application/json');


@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.get_by_id(form.email.data)
        if user:
            hashed_password = hashlib.sha512(form.password.data + user.salt).hexdigest()
            if user.password == hashed_password:
                user.authenticated = True
                user.put()
                login_user(user, remember=True)
                return redirect(url_for("admin"))
    return render_template('login.html', form=form)


@app.route("/logout", methods=["GET"])
@login_required
def logout():
    user = current_user
    user.authenticated = False
    user.put()
    logout_user()
    return redirect(url_for("login"))
