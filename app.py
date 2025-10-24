from flask import Flask, request, jsonify
from ddgs import DDGS
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
@app.route('/detect-website', methods=['POST'])
def detect_website():
    try:
        # Get outlet name from request JSON
        data = request.get_json()

        
        if not data or 'outlet_name' not in data:
            return jsonify({
                'status': 'error',
                'message': 'outlet_name is required in request body'
            }), 400
        
        outlet_name = data['outlet_name']
        
        # Your original logic
        query = f"{outlet_name} official site"
        keyword = outlet_name.split()[0].lower()

        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=10)

            for res in results:
                print(res)
                url = res.get("href", "").strip()
                title = res.get("title", "").lower()
                body = res.get("body", "").lower()
                
                if not url.startswith("http") or not url.endswith(('.com/', ".in/", ".org/", ".net/", ".com", ".in", ".org", ".net")):
                    continue

                if outlet_name.lower() in title:
                    if any(t in title for t in ["official", "news", "home", "latest"]) or any(t in body for t in ["official", "news", "home", "latest"]) and (not any(t in title for t in ["wikipedia","epaper"]) or any(t in body for t in ["wikipedia","epaper"])):
                        return jsonify({
                            'status': 'success',
                            'outlet_name': outlet_name,
                            'website': url
                        })
        
        # If no website found
        return jsonify({
            'status': 'not_found',
            'outlet_name': outlet_name,
            'message': 'No official website found'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }), 500


if __name__ == '__main__':
    app.run()