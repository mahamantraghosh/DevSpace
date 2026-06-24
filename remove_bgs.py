import rembg
from PIL import Image
import requests
from io import BytesIO
import os

def process_image(input_path_or_url, output_path):
    print(f"Processing {input_path_or_url}...")
    if input_path_or_url.startswith("http"):
        response = requests.get(input_path_or_url)
        img = Image.open(BytesIO(response.content))
    else:
        img = Image.open(os.path.join("public", input_path_or_url.lstrip("/")))
    
    output = rembg.remove(img)
    output.save(os.path.join("public", output_path))
    print(f"Saved {output_path}")

process_image("https://thumbs.dreamstime.com/b/radha-krishna-vector-illustration-holding-hands-against-pink-purple-gradient-cloud-background-depicted-wears-422980769.jpg", "radha_krishna_light_cutout.png")
process_image("https://paintwaint.in/cdn/shop/files/Background-2025-04-03T144407.378.png", "light_image2_cutout.png")
process_image("/dark_bg1.png", "dark_image1_cutout.png")
# We also have the nightcafe one:
process_image("https://creator.nightcafe.studio/jobs/UMfJp2JtSK1zmB5C9bv5/UMfJp2JtSK1zmB5C9bv5--0--vuoem.jpg", "dark_image2_cutout.png")

