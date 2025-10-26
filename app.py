from flask import Flask, request, jsonify
from ddgs import DDGS
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import time

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
@app.route('/extract-journalists', methods=['POST'])
def extract_journalists_route():
    try:
        data = request.get_json()
        website_url = data.get('website_url')
        
        if not website_url:
            return jsonify({'error': 'website_url is required'}), 400
        
        journalists = extract_journalists(website_url)
        
        return jsonify({
            'status': 'success',
            'journalists_found': len(journalists),
            'journalists': journalists
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Your existing journalist extraction functions
def extract_journalists(website_url):
    journalists = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # Strategy 1: Check common author pages
    author_pages = [
        "/author", "/authors", "/journalists", "/staff", 
        "/team", "/writers", "/reporters", "/contributors"
    ]
    
    for page in author_pages:
        try:
            url = website_url.rstrip('/') + page
            response = requests.get(url, timeout=10,headers=headers)
            if response.status_code != 404:
                soup = BeautifulSoup(response.content, 'html.parser')
                names = extract_names_from_author_links(soup,website_url)
                journalists.extend(names)
                
                if len(journalists) >= 30:
                    return journalists[:30]
        except:
            continue

    # Strategy 2: Extract from recent articles
    if len(journalists) < 30:
        try:
            response = requests.get(website_url, timeout=10, headers=headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find article links on homepage
                article_links = set()
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if 'author' in href.lower() or 'columns' in href.lower() or any(keyword in href.lower() for keyword in ['/article/', '/news/', '/story/', '/202', '/blog/', '/report/', '/feature/']):
                        if href.startswith('/'):
                            href = website_url.rstrip('/') + href
                        elif href.startswith('./'):
                            href = website_url.rstrip('/') + href[1:]
                        article_links.add(href)
                
                # Get authors from articles
                for i, article_url in enumerate(list(article_links)[:20]):  
                    try:
                        article_response = requests.get(article_url, timeout=10, headers=headers)
                        if article_response.status_code == 200:
                            article_soup = BeautifulSoup(article_response.content, 'html.parser')
                            author_names = extract_names_from_author_links(article_soup,website_url)
                            journalists.extend(author_names)
                            
                            if len(journalists) >= 30:
                                return journalists[:30]
                        time.sleep(1)
                    except Exception as e:
                        continue
        except Exception as e:
            pass

    return journalists[:30]

def extract_names_from_author_links(soup,website_url):
    names = set()
    data=[]
    
    a_tags = soup.find_all('a', href=True)
    for a_tag in a_tags:
        href = a_tag.get('href', '').lower()
        if website_url not in href:
            href = website_url + href
        text = a_tag.get_text().strip()
        
        if '/author/' in href or 'author' in href or '/journalist/' in href or '/writer/' in href or '/reporter/' in href:
            
            if a_tag.find():
                heading = a_tag.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                if heading and heading.get_text().strip():
                    name = heading.get_text().strip()
                    if is_likely_name(name) and name not in names:
                        names.add(name)
                        data.append({"name": name, "profile_url": href})
                        continue
                
                if text and is_likely_name(text) and text not in names:
                    names.add(text)
                    data.append({"name": text, "profile_url": href})
                    continue
                    
                for child in a_tag.descendants:
                    if child.name is None and child.strip():
                        potential_name = child.strip()
                        if is_likely_name(potential_name) and potential_name not in names:
                            names.add(potential_name)
                            data.append({"name": potential_name, "profile_url": href})
                            break
            
            else:
                if text and is_likely_name(text) and text not in names:
                    names.add(text)
                    data.append({"name": text, "profile_url": href})
    
    return data

def is_likely_name(text):
    if not text or len(text) > 50 or len(text) < 3:
        return False
    
    text = ' '.join(text.split())
    
    if not re.match(r'^[A-Za-z\s\.\-]+$', text):
        return False
    
    words = text.split()
    if len(words) < 2 or len(words) > 4:
        return False
    
    if not words[0][0].isupper():
        return False
    
    return True


if __name__ == '__main__':
    app.run()