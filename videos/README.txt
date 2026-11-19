Videos for the website
======================
The site looks for three files in this folder:

  hero.mp4      Home page, full-screen background loop (8-30 seconds, no sound needed)
  workshop.mp4  Home page, "See how we build"
  projects.mp4  Gallery page, "Project video"

If a file is missing, the site still looks right: it shows a photo instead
and hides the play button. Nothing is broken.

Option 1 - download matching clips from Pexels automatically
  1. Free API key: https://www.pexels.com/api/
  2. In the vanyra-website folder, open a terminal and run (needs Node 18+):
       node scripts/fetch-pexels-videos.mjs YOUR_API_KEY
  3. Not happy with a clip?  Preview the options first:
       node scripts/fetch-pexels-videos.mjs YOUR_API_KEY --list
     then pick another one, for example the 3rd match for the hero:
       node scripts/fetch-pexels-videos.mjs YOUR_API_KEY --only=hero --pick=3 --force

Option 2 - use your own clips
  Save them here with the names above. MP4 (H.264), 10-40 MB each is ideal.
  Keep each file under 100 MB (GitHub limit). For long videos, upload to
  YouTube and replace the <video> tag with the YouTube embed code.
