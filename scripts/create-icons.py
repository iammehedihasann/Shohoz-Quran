from PIL import Image, ImageDraw
from pathlib import Path
for size,name,maskable in [(192,'icon-192.png',False),(512,'icon-512.png',False),(512,'icon-maskable.png',True)]:
    scale=4
    image=Image.new('RGB',(size*scale,size*scale),'#185648')
    draw=ImageDraw.Draw(image)
    def points(coords):
        offset=9 if maskable else 0
        factor=(64-2*offset)/64
        return [(int((x*factor+offset)*size*scale/64),int((y*factor+offset)*size*scale/64)) for x,y in coords]
    stroke=max(2,int(2.2*size*scale/64))
    draw.line(points([(32,46),(32,22),(26,18),(17,17),(10,19),(10,44),(18,43),(25,43),(32,46),(39,43),(46,43),(54,44),(54,19),(47,17),(38,18),(32,22)]),fill='#eee9d5',width=stroke,joint='curve')
    for coords in [[(18,25),(25,25)],[(18,32),(25,32)],[(39,25),(46,25)],[(39,32),(46,32)]]:
        draw.line(points(coords),fill='#c1aa73',width=stroke)
    image.resize((size,size),Image.Resampling.LANCZOS).save(Path('public')/name,optimize=True)
