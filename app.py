import configparser
import psycopg2
from shapely.geometry import MultiPoint
from shapely.wkb import dumps
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
    #data = request.json
    #data = request.data.decode('utf-8')
    data = request.json
    print(data)
    points = [(d['longitude'], d['latitude']) for d in data]
     # Convert the list of points to a MultiPoint object
    multipoint = MultiPoint(points)
    # Convert the MultiPoint object to a WKB (Well-Known Binary) representation
    wkb_multipoint = dumps(multipoint)

    # Process the received data as needed
    # ...
    insert_loc('Flask', wkb_multipoint)
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
        cur.execute(insert_query, (name, psycopg2.Binary(loc)))
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
    

if __name__ == '__main__':
    app.run()
