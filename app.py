import configparser
import psycopg2
from shapely.geometry import MultiPoint
from shapely.wkb import dumps
from datetime import datetime
from flask import Flask, request, jsonify, render_template

app = Flask(__name__, static_url_path='')

'''@app.route('/')
def index():
    return render_template('index.html')'''

@app.route('/')
def root():
    return app.send_static_file('index.html')
    
@app.route('/process_data', methods=['POST'])
def process_data():
    data = request.json
    print(data)
    dataPoints = data['dataPoints']
    formData = data['formData']
    points = [(d['longitude'], d['latitude']) for d in dataPoints]
    
    # data to insert
    name = formData[0]['value']
    email = formData[1]['value']
    item = formData[2]['value']
    color = formData[3]['value']
    date = datetime.strptime(formData[4]['value'], '%Y-%m-%d').date()
    reason = formData[5]['value']
    extra = formData[6]['value']
    
    # Convert the list of points to a MultiPoint object
    multipoint = MultiPoint(points)
    wkb_multipoint = dumps(multipoint)
    
    # Convert the list of points into a polygon
    polygon = f"POLYGON(({', '.join([f'{x} {y}' for x, y in points])}, {points[0][0]} {points[0][1]}))"
    
    #insert_loc('Flask', wkb_multipoint)
    loc_id = insert_loc(name, polygon)
    insert_form(loc_id, name, email, item, color, date, reason, extra)
    response_data = {'message': 'Data received successfully'}

    return jsonify(response_data)

def get_conn():
    config = configparser.ConfigParser()
    config.read('config.ini')

    params = {
        'host': config.get('postgresql', 'host'),
        'database': config.get('postgresql', 'database'),
        'user': config.get('postgresql', 'user'),
        'password': config.get('postgresql', 'password')
    }

    return psycopg2.connect(**params)

def insert_loc(name, loc):
    """ insert a new location into the multip_geom_data table """
    insert_query = '''INSERT INTO polygon_geom_data (name, geom) VALUES (%s, %s) RETURNING id;'''
    conn = None
    loc_id = None
    try:
        # connect to the PostgreSQL database
        conn = get_conn()
        # create a new cursor
        cur = conn.cursor()
        # execute the INSERT statement
        #cur.execute(insert_query, (name, f"MULTIPOINT(({loc}))"))
        cur.execute(insert_query, (name, loc))
        # get the generated id back
        loc_id = cur.fetchone()[0]
        # commit the changes to the database
        conn.commit()
        # close communication with the database
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()

    return loc_id

def insert_form(loc_id, name, email, item, color, date, reason, extra):
    insert_query = '''INSERT INTO form_data (loc_id, name, email, item, color, date, reason, extra) VALUES(%s, %s, %s, %s, %s, %s, %s, %s)'''
    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(insert_query, (loc_id, name, email, item, color, date, reason, extra))
        conn.commit()
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()

    return loc_id
    
    

if __name__ == '__main__':
    app.run()
