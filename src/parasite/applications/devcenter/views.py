from flask import jsonify
from parasite import app
import os
import re


########################################################################
###############################  REST API ##############################
########################################################################

@app.route('/devcenter/slides.json', methods=["GET"])
def get_slides():
    prefix = 'parasite'
    def create_node(path):
        return {
            'title' : re.sub('^\\d\. ?', '', os.path.basename(path)),
            'item'  : path[len(prefix):] + '/slide.html',
            'kids'  : [create_node(path + '/' + p)
                       for p in sorted(os.listdir(path))
                       if os.path.isdir(path + '/' + p)]
        }

    n = create_node(prefix + '/www/applications/devcenter/1. devcenter')

    return jsonify(n)