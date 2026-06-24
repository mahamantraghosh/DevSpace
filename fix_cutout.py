import rembg
from PIL import Image
import requests
from io import BytesIO
import os

print("Downloading image...")
url = "https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg"
response = requests.get(url)
img = Image.open(BytesIO(response.content))

# Try isnet-general-use
print("Running isnet-general-use...")
session = rembg.new_session("isnet-general-use")
output_isnet = rembg.remove(img, session=session)
output_isnet.save(os.path.join("public", "radha_krishna_light_cutout.png"))

print("Done!")
