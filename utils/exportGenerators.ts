
import { Subtitle, AnimationSettings } from '../types';

const FPS = 30;

const formatTimeXML = (seconds: number) => {
    // FCP7 XML uses frame count usually, or -1
    return Math.round(seconds * FPS);
};

const escapeXML = (str: string) => {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

export const generatePremiereXML = (subtitles: Subtitle[], settings: AnimationSettings, fileName: string) => {
    const durationFrames = Math.ceil((subtitles[subtitles.length - 1]?.endTime || 0) * FPS) + 100;

    const tracks = subtitles.map((sub, index) => {
        const startFrame = Math.round(sub.startTime * FPS);
        const endFrame = Math.round(sub.endTime * FPS);
        const duration = endFrame - startFrame;

        // Premiere XML Text Generator
        // This is a basic implementation. Premiere's XML support for text is limited.
        // We use the standard "Text" generator.

        return `
        <clipitem id="clipitem-${index}">
            <name>${escapeXML(sub.text)}</name>
            <enabled>TRUE</enabled>
            <duration>${duration}</duration>
            <rate>
                <timebase>${FPS}</timebase>
                <ntsc>FALSE</ntsc>
            </rate>
            <start>${startFrame}</start>
            <end>${endFrame}</end>
            <in>0</in>
            <out>${duration}</out>
            <file id="file-${index}">
                <name>${escapeXML(sub.text)}</name>
                <pathurl>file://localhost/placeholder/${index}.txt</pathurl>
                <rate>
                    <timebase>${FPS}</timebase>
                    <ntsc>FALSE</ntsc>
                </rate>
                <media>
                    <video>
                        <samplecharacteristics>
                            <width>1920</width>
                            <height>1080</height>
                        </samplecharacteristics>
                    </video>
                </media>
            </file>
            <filter>
                <effect>
                    <name>Text</name>
                    <effectid>Text</effectid>
                    <effectcategory>Text</effectcategory>
                    <effecttype>generator</effecttype>
                    <mediatype>video</mediatype>
                    <parameter>
                        <name>Text</name>
                        <value>${escapeXML(sub.text)}</value>
                    </parameter>
                    <parameter>
                        <name>Font</name>
                        <value>${settings.fontFamily}</value>
                    </parameter>
                    <parameter>
                        <name>Size</name>
                        <value>${parseInt(settings.fontSize) || 48}</value>
                    </parameter>
                    <parameter>
                        <name>Font Color</name>
                        <value>
                            <alpha>255</alpha>
                            <red>255</red>
                            <green>255</green>
                            <blue>255</blue>
                        </value>
                    </parameter>
                </effect>
            </filter>
            <labels>
                <label2>Violet</label2>
            </labels>
        </clipitem>
    `;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
    <sequence>
        <name>${escapeXML(fileName)}</name>
        <duration>${durationFrames}</duration>
        <rate>
            <timebase>${FPS}</timebase>
            <ntsc>FALSE</ntsc>
        </rate>
        <media>
            <video>
                <format>
                    <samplecharacteristics>
                        <rate>
                            <timebase>${FPS}</timebase>
                            <ntsc>FALSE</ntsc>
                        </rate>
                        <width>1920</width>
                        <height>1080</height>
                        <pixelaspectratio>square</pixelaspectratio>
                    </samplecharacteristics>
                </format>
                <track>
                    ${tracks}
                </track>
            </video>
        </media>
    </sequence>
</xmeml>`;
};

export const generateDaVinciFusion = (subtitles: Subtitle[], settings: AnimationSettings) => {
    // Generate a Fusion Text+ node with keyframed StyledText

    let textKeyframes = '';

    // Sort subtitles by time just in case
    const sortedSubs = [...subtitles].sort((a, b) => a.startTime - b.startTime);

    sortedSubs.forEach(sub => {
        const startFrame = Math.round(sub.startTime * FPS);
        // Fusion uses 0-based indexing usually, but let's stick to frame numbers

        // We set the text at the start frame
        textKeyframes += `
                        [${startFrame}] = "${escapeFusionString(sub.text)}",
    `;

        // Optionally clear text after end time?
        // const endFrame = Math.round(sub.endTime * FPS);
        // textKeyframes += `[${endFrame}] = "",\n`;
    });

    // Basic Fusion Text+ Structure
    return `{
	Tools = ordered() {
		Text1 = TextPlus {
			CtrlWZoom = false,
			Inputs = {
				GlobalIn = Input { Value = 0, },
				GlobalOut = Input { Value = ${Math.round(sortedSubs[sortedSubs.length - 1].endTime * FPS) + 100}, },
				Width = Input { Value = 1920, },
				Height = Input { Value = 1080, },
				UseFrameFormatSettings = Input { Value = 1, },
				["Gamut.SLogVersion"] = Input { Value = FuID { "SLog2" }, },
				Center = Input { Value = { 0.5, 0.5 }, },
				StyledText = Input {
					Source = "Text",
					Value = StyledText {
						Value = "",
						Font = {
							Value = "${settings.fontFamily}",
						},
						Style = {
							Value = "Regular",
						},
						Size = {
							Value = ${(parseInt(settings.fontSize) || 48) / 1080}, -- Fusion size is relative to height usually
						},
						Color = {
							Value = { 1, 1, 1, 1 },
						},
					},
					KeyFrames = {
                        ${textKeyframes}
					}
				},
                -- Add some basic shading/effects if needed
			},
			ViewInfo = OperatorInfo { Pos = { 0, 0 } },
		}
	}
}`;
};

const escapeFusionString = (str: string) => {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
};
