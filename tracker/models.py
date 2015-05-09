"""
models.py

App Engine datastore models

"""

from google.appengine.ext import ndb

class Point(ndb.Model):
    title = ndb.StringProperty()
    desc = ndb.StringProperty()
    latitude = ndb.FloatProperty(required=True)
    longitude = ndb.FloatProperty(required=True)
    resource = ndb.StringProperty()
    type = ndb.StringProperty(required=True)
    date = ndb.DateTimeProperty()
    pointid = ndb.IntegerProperty()

    @classmethod
    def delete_all(cls, delete_type):
        ndb.delete_multi(
            cls.query(cls.type == delete_type).fetch(keys_only=True)
        )
        return True

    def to_dict(self):
        result = super(Point,self).to_dict()
        result['id'] = self.key.id()
        return result


class Tracker(ndb.Model):
    type = ndb.StringProperty(required=True)
    url = ndb.StringProperty(required=True)
    poll_interval = ndb.IntegerProperty(required=True)
    date_added = ndb.DateTimeProperty(auto_now=True)

    def to_dict(self):
        result = super(Tracker,self).to_dict()
        del result['date_added']
        return result
