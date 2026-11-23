# Renders the video's frames with PIL: hook cards, the prompt being typed,
# the agent-working terminal, then the real gameplay (draw calls dumped by
# game/demo.js from the same engine that ships in game/index.html).
# Run: python3 render_frames.py   -> writes frames/f0000.png ... (780 frames)
import json, math, os
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frames')
os.makedirs(OUT, exist_ok=True)

SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SANS_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
MONO_B = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'

def hex2rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

def font(path, size):
    return ImageFont.truetype(path, size)

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines

def bg(color):
    return Image.new('RGB', (W, H), color)

# ---------------- scene A: hook, 0-4s ----------------
def scene_a(i):
    im = bg('#0b1026')
    d = ImageDraw.Draw(im)
    # stars (scattered, deterministic)
    for k in range(70):
        x = (((k + 1) * 2654435761) & 0xFFFFFFFF) % W
        y = (((k + 1001) * 2654435761) & 0xFFFFFFFF) % H
        d.ellipse([x, y, x + 3, y + 3], fill='#ffffff')
    lines = [
        (0, 'ONE PROMPT.', SANS_B, 118, '#ffffff'),
        (30, 'ONE GAME.', SANS_B, 118, '#ffd23f'),
        (60, 'ZERO CODE', SANS_B, 100, '#ffffff'),
        (60, 'TYPED BY HAND.', SANS_B, 100, '#9aa3ff'),
    ]
    y = 560
    for start, txt, fnt, size, col in lines:
        if i >= start:
            a = min(255, (i - start) * 25)
            f = font(fnt, size)
            mask = Image.new('L', (W, H), 0)
            md = ImageDraw.Draw(mask)
            md.text((W // 2, y), txt, font=f, fill=a, anchor='mm')
            solid = Image.new('RGBA', (W, H), hex2rgb(col) + (255,))
            im = Image.alpha_composite(im.convert('RGBA'),
                                       Image.composite(solid, Image.new('RGBA', (W, H), (0, 0, 0, 0)), mask)).convert('RGB')
            d = ImageDraw.Draw(im)
        y += 190 if size > 120 else 150
    if i >= 100:
        f = font(SANS, 44)
        d.text((W // 2, 1560), 'watch my AI agent build it', font=f, fill='#9aa3ff', anchor='mm')
    return im

# ---------------- scene B: prompt + terminal, 4-10s ----------------
PROMPT = 'build me a tiny browser game I can actually play'
TERM = [
    ('agent', 'reading the prompt...'),
    ('agent', 'writing game code...'),
    ('agent', 'testing: 17 checks passed'),
    ('agent', 'it runs. let\'s play.'),
]

def scene_b(i):
    im = bg('#0b1026')
    d = ImageDraw.Draw(im)
    # prompt card
    d.rounded_rectangle([70, 150, W - 70, 560], radius=36, fill='#141a3d', outline='#2a3560', width=3)
    d.text((110, 190), 'YOU', font=font(MONO_B, 40), fill='#9aa3ff')
    typed = PROMPT[: max(0, (i - 5) // 2)]
    f = font(MONO, 46)
    lines = wrap(d, typed + ('▌' if (i // 15) % 2 == 0 and i < 5 + len(PROMPT) * 2 else ''), f, W - 220)
    y = 260
    for ln in lines:
        d.text((110, y), ln, font=f, fill='#ffffff')
        y += 62
    # terminal lines
    y = 660
    d.text((70, y), 'AGENT', font=font(MONO_B, 40), fill='#7dff8a')
    y += 80
    for idx, (who, txt) in enumerate(TERM):
        start = 70 + idx * 26
        if i >= start:
            shown = txt[: max(0, (i - start) * 2)]
            d.text((70, y), '> ' + shown, font=font(MONO, 42), fill='#e8f4ff')
            if len(shown) == len(txt):
                d.text((70 + d.textlength('> ' + txt, font=font(MONO, 42)) + 12, y), '✓', font=font(SANS_B, 42), fill='#7dff8a')
        y += 78
    if i >= 170:
        d.text((W // 2, 1500), 'no hands touched a keyboard.', font=font(SANS, 44), fill='#ffd23f', anchor='mm')
        d.text((W // 2, 1570), 'one prompt in, one game out.', font=font(SANS, 44), fill='#ffffff', anchor='mm')
    return im

# ---------------- scene C: real gameplay ----------------
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'demo-frames.json')) as fh:
    GAME_FRAMES = json.load(fh)

def pil_font(spec, size):
    # spec like 'bold 28px monospace' / '20px monospace'
    bold = 'bold' in spec
    return font(MONO_B if bold else MONO, size * 2)

def render_game(ops):
    # One RGBA overlay for the whole frame: every op draws into it (with its
    # own alpha), then a single composite onto the background. Drawing each
    # op as its own full-frame overlay was ~100 composites per frame.
    base = Image.new('RGBA', (W, H), (11, 16, 38, 255))
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    stack = []
    tx, ty = 0, 0
    for op in ops:
        k = op[0]
        if k == 'save':
            stack.append((tx, ty))
        elif k == 'restore':
            tx, ty = stack.pop() if stack else (0, 0)
        elif k == 'tr':
            tx += op[1] * 2; ty += op[2] * 2
        elif k == 'rect':
            _, x, y, w, h, col, ga = op
            d.rectangle([x * 2 + tx, y * 2 + ty, (x + w) * 2 + tx, (y + h) * 2 + ty],
                        fill=hex2rgb(col) + (int(ga * 255),))
        elif k == 'circle':
            _, x, y, r, col, ga = op
            d.ellipse([x * 2 - r * 2 + tx, y * 2 - r * 2 + ty, x * 2 + r * 2 + tx, y * 2 + r * 2 + ty],
                      fill=hex2rgb(col) + (int(ga * 255),))
        elif k == 'tri':
            _, x1, y1, x2, y2, x3, y3, col, ga = op
            d.polygon([(x1 * 2 + tx, y1 * 2 + ty), (x2 * 2 + tx, y2 * 2 + ty), (x3 * 2 + tx, y3 * 2 + ty)],
                      fill=hex2rgb(col) + (int(ga * 255),))
        elif k == 'text':
            _, s, x, y, col, fspec, align, ga = op
            size = int(fspec.split('px')[0].split()[-1])
            f = pil_font(fspec, size)
            if any(ord(c) > 0x2500 for c in s):
                f = font(SANS_B if 'bold' in fspec else SANS, size * 2)
            anchor = {'left': 'lm', 'center': 'mm', 'right': 'rm'}[align]
            d.text((x * 2 + tx, y * 2 + ty), s, font=f, fill=hex2rgb(col) + (int(ga * 255),), anchor=anchor)
    return Image.alpha_composite(base, ov).convert('RGB')

def scene_c(i):
    frame = GAME_FRAMES[min(i, len(GAME_FRAMES) - 1)]
    im = render_game(frame)
    if i < 45:  # title flash over the first 1.5s
        a = 255 if i < 30 else int(255 * (45 - i) / 15)
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.rectangle([0, 0, W, H], fill=(5, 8, 26, int(a * 0.45)))
        od.text((W // 2, 900), 'THE FINISHED GAME', font=font(SANS_B, 72), fill=(255, 255, 255, a), anchor='mm')
        od.text((W // 2, 990), 'really playing, right now', font=font(SANS, 46), fill=(255, 210, 63, a), anchor='mm')
        im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
    return im

# ---------------- render all ----------------
n = 0
for i in range(120):
    scene_a(i).save(os.path.join(OUT, 'f%04d.png' % n)); n += 1
for i in range(180):
    scene_b(i).save(os.path.join(OUT, 'f%04d.png' % n)); n += 1
for i in range(len(GAME_FRAMES)):
    scene_c(i).save(os.path.join(OUT, 'f%04d.png' % n)); n += 1
print('frames:', n, '=', n / FPS, 's')
