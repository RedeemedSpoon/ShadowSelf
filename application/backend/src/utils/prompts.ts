import {GoogleGenAI} from '@google/genai';
import {Location} from '@types';

function getPrompt(lang: Location, ethnicity: string, age: number, sex: string, bio: string) {
  const promptSubjectBase = `${ethnicity} ${sex} individual, aged approximately ${age}.`;

  const promptRealismDetails = `Ultra-photorealistic, candid quality photo, indistinguishable from a high-resolution photograph. Authentic natural features: highly detailed realistic skin texture (visible pores, subtle imperfections like faint blemishes or lines, natural skin oils, not overly smooth or airbrushed). Lifelike eyes conveying genuine emotion, looking directly at the camera/viewer with a natural and engaging gaze (sparkle in eyes, realistic reflections, avoiding vacant stares, dead eyes, glassy eyes, or unnatural intensity), creating a sense of connection. Natural unposed expression and posture, capturing a spontaneous moment. Realistic, natural lighting appropriate for the scene, creating depth and dimension, primarily illuminating the subject. Genuine human traits, personality, warmth, approachability, avoiding stereotypes or artificiality. Integrate the following description naturally: ${bio}. The image should look like it was captured organically, suitable for sharing on social media. Ultra-high detail and sharp focus specifically on the subject, making them the undeniable primary element and dominant visual focus of the composition, occupying a significant and prominent portion of the frame. The background, while present and contextual, must remain secondary and not overshadow the subject; it can be slightly softer in focus to enhance subject prominence.`;

  const negativePromptStart =
    'unrealistic, fake, cgi, vfx, sfx, illustration, painting, drawing, 3D render, cartoon, anime, sketch, doll-like, mannequin, toy, video game, digital art, plastic skin, overly smooth skin, airbrushed skin, polished skin, flawless skin, artificial skin, exaggerated features, deformed, disfigured, mutated, extra limbs, missing limbs, bad anatomy, unrealistic body proportions, stiff pose, unnatural pose, vacant stare, dead eyes, glassy eyes, expressionless, eyes looking away from camera (unless taking a mirror selfie and looking at reflection), eyes looking sideways, crossed eyes, lazy eye, eyes closed (unless contextually appropriate like laughing hard or sleeping), bad lighting, studio lighting (unless specified for a specific studio scene), flat lighting, harsh lighting, blurry subject, out of focus subject, low quality, noisy, grainy (unless stylistically intended for film look), low-resolution, watermark, signature, text, logo, multiple people (unless specified), collage, frame, border, over-processed, photoshopped, subject too small, subject tiny, subject distant, subject obscured, background too prominent, subject not main focus, background dominates, subject lost in background, overly wide shot making subject small, unflattering composition for subject, poorly composed, subject in shadow unless artistically intended for specific scene.';

  const cityCountry = `${lang?.city}, ${lang?.country}`;
  const probabilities = Math.floor(Math.random() * 8) + 1;

  let sceneNegativePrompt = '';
  let scenePrompt = '';

  switch (probabilities) {
    case 1: // Bustling Street
      scenePrompt = `Medium close-up shot, with ${promptSubjectBase} as the clear and dominant subject, walking confidently down a bustling, vibrant street in ${cityCountry}, looking warmly towards the camera. Subject should occupy a significant portion of the foreground, sharply in focus. Detailed background: crowded sidewalks, diverse people (more blurred), colorful street vendors, textured building facades (mix of old and new), street trees, cars. Subject is laughing or smiling warmly, natural gait. Energetic atmosphere, natural sunlight casting soft, distinct shadows on the subject and environment. Background elements are present for context but are secondary and noticeably more blurred to emphasize the subject. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'full body shot, extreme close-up (unless bio implies it), headshot only, face shot only, subject fills frame entirely, isolated subject, empty streets, desolate cityscape, plain buildings, sterile environment, generic background, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 2: // Park Scene
      scenePrompt = `Medium close-up shot of ${promptSubjectBase} sitting comfortably on a grassy patch or a park bench in a detailed park in ${cityCountry}, looking directly at the camera with a pleasant expression. The subject is the prominent focal point, sharply detailed and occupying a good portion of the frame. Scene includes: lush green grass, diverse trees casting soft, dappled shadows, blooming flowerbeds, other park elements like benches or distant people (softly blurred in the background). Subject smiling joyfully (perhaps with pet if bio fits) or soaking in the peaceful atmosphere. Warm, natural daylight. Relaxed, natural posture. While the park setting is visible, it serves as a supporting backdrop and should not compete for attention with the subject. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'extreme close-up (face only), subject fills frame entirely, isolated subject, barren park, dead grass, artificial greenery, flat landscape, studio backdrop, plain background, solid color background, gradient background, no background details, harsh shadows, direct overhead sun causing squinting, subject very small in frame.';
      break;

    case 3: // Cozy Living Room
      scenePrompt = `Medium close-up shot of ${promptSubjectBase} relaxing in a lived-in living room in ${cityCountry}, looking thoughtfully towards the camera. The subject should be the most detailed and prominent element, sharply in focus. Scene details: soft ambient light from a window or warm lamps illuminating the subject, plush sofa (textured cushions/throws), wooden coffee table (realistic clutter: books, mug, plant), wall decor (photos/art). Window showing a glimpse of the outside adds depth. Subject leaning back, content expression (e.g., perhaps sipping a drink while making eye contact). The living room details provide a cozy context but are clearly secondary to the subject, possibly with a shallower depth of field. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'extreme close-up (face only), subject fills frame, isolated subject, empty room, sterile interior, minimalist design (unless specified in bio), no personal items, harsh lighting, unrealistic furniture, studio backdrop, plain background, solid color background, gradient background, no background details, overly dark, poorly lit, subject indistinct from background.';
      break;

    case 4: // Bedroom Scene
      scenePrompt = `Medium close-up, tightly framing ${promptSubjectBase} in a relatable, personalized bedroom in ${cityCountry}, looking towards the camera with a natural expression. Subject is the undeniable central focus, sharply detailed. Setting: comfortable bed with soft textured bedding, bedside table with lamp/book/personal items, wall decor like posters/photos. Soft natural light from a window (hint of outside view) highlighting the subject. Subject could be looking thoughtfully towards the camera, perhaps with headphones on suggesting listening to music, or simply relaxing with a contemplative, bored, or serene expression directed at the viewer. Personal bedroom elements provide an intimate but secondary backdrop, with a focus pull on the subject. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'wide shot, full body shot, subject far away, empty sterile bedroom, perfectly tidy showroom look, no personal objects, harsh lighting, unrealistic bed, generic hotel room look, studio backdrop, plain background, solid color background, gradient background, no background details, subject completely in shadow, subject blurry.';
      break;

    case 5: // Beach Selfie
      scenePrompt = `Selfie style medium close-up, where ${promptSubjectBase}'s face and upper body prominently fill a significant portion of the frame, in sharp, crisp focus, looking directly into the camera lens (phone). Taken on a sunny, sandy beach in ${cityCountry}. Subject has a bright, joyful smile, playful or relaxed posture, holding the phone as if taking the selfie (phone might be partially visible or implied). The vibrant beach background (realistic golden sand, blue ocean with gentle waves, distant palm trees/beachgoers) is clearly visible but serves as a distinct, slightly softer-focused backdrop, ensuring the subject is the absolute focus. Bright, natural sunlight, creating a warm, inviting glow on the subject. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'subject blocking entire background, out of focus subject, blurry background (unless artistically very soft), empty desolate beach, flat gray sand, motionless water, overcast sky, studio backdrop, plain background, solid color background, gradient background, no background details, third-person shot, subject not holding phone, awkward arm position, subject small in frame.';
      break;

    case 6: // Modern Cafe
      scenePrompt = `Medium close-up shot, centering on ${promptSubjectBase} at a table in a bustling but cozy modern cafe in ${cityCountry}, looking up towards the camera with an engaging expression. The subject is the primary focus, sharply detailed and prominently featured. Perhaps with a laptop or book open on the table but their attention is on the viewer. Details: wooden tables (slight wear), comfortable chairs, warm ambient lighting (from lamps/windows) illuminating the subject, shelves (books/plants), background glimpse of barista/other customers (softly blurred for depth, secondary to subject). Subject has a content, thoughtful, or welcoming expression. Capture the cafe's lively yet comfortable atmosphere as a backdrop. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'extreme close-up (face only), headshot, face shot, subject fills entire frame, isolated subject, empty sterile cafe, generic furniture, no decor, studio backdrop, plain background, solid color background, gradient background, no background details, subject poorly lit.';
      break;

    case 7: // Night Concert
      scenePrompt = `Medium close-up shot focusing intensely on ${promptSubjectBase}'s reaction, immersed in the electric atmosphere of a vibrant night concert in ${cityCountry}. The subject's face and upper body should be the most prominent and detailed part of the image, sharply in focus, with their face turned towards the camera, sharing their excitement with an engaging expression. Scene: colorful dynamic stage lights illuminating the subject, stage/performers visible in background (can be artistically blurred/silhouetted), surrounding crowd members (cheering/recording, softly blurred and secondary). Subject's face shows excitement, awe, or joy (as if momentarily looking at a friend taking the photo). Dynamic low-light photography style, possible artistic light flares or bokeh that enhance rather than obscure the subject. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'extreme close-up (face only), headshot, subject fills frame, isolated subject, empty concert venue, no stage lights, no crowd, brightly lit room, daytime concert, flat lighting, static atmosphere, studio backdrop, plain background, solid color background, gradient background, no background details, subject in complete darkness, blurry subject, subject too far back in crowd.';
      break;

    case 8: // Bathroom Selfie
      scenePrompt = `Selfie style medium close-up, ensuring ${promptSubjectBase} (and their reflection holding the phone) is the dominant element, sharply in focus and occupying a significant portion of the frame. Taken in a well-lit, clean, and relatable bathroom mirror in ${cityCountry}. Subject is looking at their reflection (which is where the camera is focused for a mirror selfie), holding a phone which is visible in the reflection. Casual, confident, or playful expression. Bathroom is tidy with simple background details: part of a sink, counter with a few tasteful toiletries, tiled wall, good soft lighting (e.g., vanity lights) illuminating the subject. The mirror reflection should be clear and accurate. Bathroom details are visible but secondary, providing context without distracting from the subject. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'wide shot, subject far from mirror, dirty bathroom, excessively cluttered bathroom, public restroom, dark bathroom, poorly lit, unrealistic reflections, distorted reflection, no mirror, subject not holding phone, phone not visible, blurry mirror, subject looking away from mirror/phone, overly steamy, harsh flash, studio backdrop, plain background, solid color background, gradient background, subject small in reflection.';
      break;
  }

  const finalNegativePrompt = `${negativePromptStart} ${sceneNegativePrompt}`;
  return {negativePrompt: finalNegativePrompt, prompt: scenePrompt};
}

export async function generateProfile(lang: Location, age: number, sex: string, ethnicity: string, bio: string): Promise<string> {
  const {prompt} = getPrompt(lang, ethnicity, age, sex, bio);
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({apiKey});

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: prompt,
    config: {temperature: 0.9},
  });

  for (const part of response.candidates![0]!.content!.parts!) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      return imageData!;
    }
  }
}
