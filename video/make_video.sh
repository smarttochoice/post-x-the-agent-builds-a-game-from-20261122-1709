#!/bin/bash
# Assemble game-video.mp4 from the PIL frames in frames/:
#   23.5s of the clip + 2.5s tail under make.fun's 9:16 referral end card
#   (blurred + desaturated gameplay beneath, code typed in once the card
#   rests) + 3.5s hold on the finished card with the code visible.
# Total 29.5s, 1080x1920, H.264 + AAC. Run from this directory.
set -euo pipefail
cd "$(dirname "$0")"

CODE='w57pvztf'
MONO_B=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
DRAW="drawtext=fontfile=$MONO_B:text='$CODE':fontsize=62:fontcolor=#191419:x=210:y=1245"

# Part 1: the 780 PIL frames at 30 fps.
ffmpeg -y -v error -framerate 30 -i frames/f%04d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow part1.mp4

# Final assembly.
ffmpeg -y -v error -i part1.mp4 -i endcard-9x16.webm \
  -f lavfi -i "aevalsrc='0.10*sin(2*PI*110*t)+0.07*sin(2*PI*165*t)+0.05*sin(2*PI*220*t*(1+0.3*sin(2*PI*0.125*t)))':s=44100:d=29.5" \
  -filter_complex "\
[0:v]split=2[full][tail0];\
[full]trim=0:23.5,setpts=PTS-STARTPTS[head];\
[tail0]trim=23.5:26,setpts=PTS-STARTPTS,gblur=sigma=28,hue=s=0[tailblur];\
[1:v]format=yuva420p[card];\
[tailblur][card]overlay=0:0,$DRAW:enable='gte(t,1.5)'[enda];\
[enda]split=2[enda1][endalast];\
[endalast]select='eq(n,74)',loop=loop=104:size=1:start=0,setpts=N/30/TB,$DRAW[hold];\
[head][enda1][hold]concat=n=3:v=1:a=0[vout];\
[2:a]atrim=0:29.5,afade=t=out:st=27:d=2.5[aout]" \
  -map "[vout]" -map "[aout]" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow \
  -c:a aac -b:a 96k -movflags +faststart game-video.mp4

ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate,duration \
  -of default=nw=1 game-video.mp4
ls -la game-video.mp4
