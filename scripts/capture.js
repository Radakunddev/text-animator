
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../out');
const FPS = 30;

async function capture() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Navigate to the app - assuming it's running on localhost:5173
    // We add ?export=true to signal the app to hide controls if needed
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173?export=true', { waitUntil: 'networkidle0' });

    // Wait for the app to be ready and expose the seekTo function
    await page.waitForFunction('window.seekTo !== undefined');

    // Get duration from the app
    const duration = await page.evaluate(() => window.getDuration());
    console.log(`Video duration: ${duration} seconds`);

    if (duration === 0) {
        console.log("Warning: Duration is 0. Make sure subtitles are loaded.");
    }

    const totalFrames = Math.ceil(duration * FPS);
    console.log(`Total frames to capture: ${totalFrames}`);

    for (let i = 0; i < totalFrames; i++) {
        const time = i / FPS;

        // Seek to specific time
        await page.evaluate((t) => window.seekTo(t), time);

        // Wait a bit for React to render and animations to settle
        // In a perfect world, seekTo returns a promise that resolves after render
        // For now, we add a small safety delay if needed, but let's trust the seekTo implementation first
        // await new Promise(r => setTimeout(r, 100)); 

        const frameNum = String(i).padStart(4, '0');
        const filePath = path.join(OUTPUT_DIR, `frame_${frameNum}.png`);

        await page.screenshot({ path: filePath, type: 'png' });

        if (i % 10 === 0) {
            console.log(`Captured frame ${i}/${totalFrames}`);
        }
    }

    console.log('Frame capture complete.');
    await browser.close();

    if (totalFrames > 0) {
        // Run FFmpeg
        const ffmpegCommand = `"${ffmpegPath}" -y -framerate ${FPS} -i "${path.join(OUTPUT_DIR, 'frame_%04d.png')}" -c:v libx264 -pix_fmt yuv420p "${path.join(OUTPUT_DIR, 'output.mp4')}"`;

        console.log('Running FFmpeg...');
        console.log(ffmpegCommand);

        exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`FFmpeg error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`FFmpeg stderr: ${stderr}`);
            }
            console.log(`FFmpeg stdout: ${stdout}`);
            console.log('Video export complete: ' + path.join(OUTPUT_DIR, 'output.mp4'));
        });
    } else {
        console.log("Skipping FFmpeg because no frames were captured.");
    }
}

capture().catch(console.error);
