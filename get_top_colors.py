import urllib.request
from PIL import Image
import io

def get_colors(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            img = Image.open(io.BytesIO(response.read()))
            img = img.convert('RGB')
            width, height = img.size
            
            y_top = int(height * 0.01)
            y_bot = int(height * 0.99)
            
            top_mid = img.getpixel((int(width * 0.5), y_top))
            bot_mid = img.getpixel((int(width * 0.5), y_bot))
            
            def to_hex(rgb):
                return '#%02x%02x%02x' % rgb
                
            print(f"URL: {url}")
            print(f"Top Mid: {to_hex(top_mid)}, Bot Mid: {to_hex(bot_mid)}")
    except Exception as e:
        print(f"Failed for {url}: {e}")

get_colors("https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg")
get_colors("https://paintwaint.in/cdn/shop/files/Background-2025-04-03T144407.378.png")
get_colors("https://creator.nightcafe.studio/jobs/UMfJp2JtSK1zmB5C9bv5/UMfJp2JtSK1zmB5C9bv5--0--vuoem.jpg")
