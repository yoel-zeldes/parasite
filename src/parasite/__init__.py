'''
Created on Nov 11, 2013

@author: yoel
'''

from flask.app import Flask


app = Flask(__name__, static_folder="www", template_folder='www')

from views import *
from applications import *