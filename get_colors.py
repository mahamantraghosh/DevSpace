import urllib.request
from PIL import Image
import io

def get_bottom_colors(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            img = Image.open(io.BytesIO(response.read()))
            img = img.convert('RGB')
            width, height = img.size
            
            y = int(height * 0.99) # right at bottom
            left = img.getpixel((int(width * 0.1), y))
            mid = img.getpixel((int(width * 0.5), y))
            right = img.getpixel((int(width * 0.9), y))
            
            def to_hex(rgb):
                return '#%02x%02x%02x' % rgb
                
            print(f"URL: {url}")
            print(f"Colors: Left {to_hex(left)}, Mid {to_hex(mid)}, Right {to_hex(right)}")
    except Exception as e:
        print(f"Failed for {url}: {e}")

get_bottom_colors("https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg")
get_bottom_colors("https://paintwaint.in/cdn/shop/files/Background-2025-04-03T144407.378.png")
get_bottom_colors("https://creator.nightcafe.studio/jobs/UMfJp2JtSK1zmB5C9bv5/UMfJp2JtSK1zmB5C9bv5--0--vuoem.jpg")
def get_local_bottom_colors(path):
    try:
        img = Image.open(path)
        img = img.convert('RGB')
        width, height = img.size
        
        y = int(height * 0.99)
        left = img.getpixel((int(width * 0.1), y))
        mid = img.getpixel((int(width * 0.5), y))
        right = img.getpixel((int(width * 0.9), y))
        
        def to_hex(rgb):
            return '#%02x%02x%02x' % rgb
            
        print(f"File: {path}")
        print(f"Colors: Left {to_hex(left)}, Mid {to_hex(mid)}, Right {to_hex(right)}")
    except Exception as e:
        print(f"Failed for {path}: {e}")

get_local_bottom_colors("public/dark_bg1.png")
