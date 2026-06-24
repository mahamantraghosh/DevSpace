import sys
from PIL import Image
import numpy as np

def create_extensions(img_path, top_out_path, bot_out_path):
    # Open the image
    img = Image.open(img_path).convert('RGB')
    width, height = img.size
    
    img_array = np.array(img)
    
    # Get the top row of pixels (average the top 5 rows to be safe)
    top_edge = np.mean(img_array[:5, :, :], axis=0).astype(np.uint8)
    
    # Get the bottom row of pixels
    bot_edge = np.mean(img_array[-5:, :, :], axis=0).astype(np.uint8)
    
    # Create a 1024 tall image for the top extension
    # It should start with the top_edge at the bottom, and fade to dark/black at the top
    top_ext = np.zeros((1024, width, 3), dtype=np.uint8)
    # The bottom row of top_ext is top_edge
    target_color_top = np.array([5, 5, 15], dtype=np.float32) # Dark space blue
    
    for y in range(1024):
        # progress from 0 (top) to 1 (bottom)
        progress = y / 1023.0
        # exponential fade to make the seam less harsh
        blend = progress ** 2 
        
        row_color = target_color_top * (1 - blend) + top_edge * blend
        top_ext[y, :, :] = row_color.astype(np.uint8)
        
    Image.fromarray(top_ext).save(top_out_path)
    
    # Create a 1024 tall image for the bottom extension
    # It should start with the bot_edge at the top, and fade to dark/black at the bottom
    bot_ext = np.zeros((1024, width, 3), dtype=np.uint8)
    target_color_bot = np.array([5, 5, 10], dtype=np.float32) # Dark ground color
    
    for y in range(1024):
        # progress from 0 (top) to 1 (bottom)
        progress = y / 1023.0
        blend = 1.0 - (progress ** 2)
        
        row_color = target_color_bot * (1 - blend) + bot_edge * blend
        bot_ext[y, :, :] = row_color.astype(np.uint8)
        
    Image.fromarray(bot_ext).save(bot_out_path)

if __name__ == "__main__":
    create_extensions("public/dark_bg1.png", "public/generated_dark1_top.png", "public/generated_dark1_bot.png")

