import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

const YOUTUBE_API_KEY =
  process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL'
  );
}

if (!SUPABASE_SECRET_KEY) {
  throw new Error(
    'Missing SUPABASE_SECRET_KEY'
  );
}

if (!YOUTUBE_API_KEY) {
  throw new Error(
    'Missing YOUTUBE_API_KEY'
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function buildSearchQuery(skill) {
  const parts = [
    skill.name,
    skill.subCategory,
    skill.category,
    'tutorial',
    'beginner',
  ];

  return parts
    .filter(Boolean)
    .join(' ');
}

async function searchYouTube(query) {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '5',
    q: query,
    key: YOUTUBE_API_KEY,
    videoEmbeddable: 'true',
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `YouTube API error ${response.status}: ${text}`
    );
  }

  const json = await response.json();

  return json.items ?? [];
}

function scoreVideo(item) {
  const title =
    item?.snippet?.title?.toLowerCase() ?? '';

  const description =
    item?.snippet?.description?.toLowerCase() ?? '';

  const combined =
    `${title} ${description}`;

  let score = 0;

  const goodWords = [
    'tutorial',
    'how to',
    'beginner',
    'learn',
    'guide',
    'technique',
    'tips',
    'step by step',
  ];

  const badWords = [
    'shorts',
    '#shorts',
    'reaction',
    'compilation',
    'highlights',
    'funny',
    'fails',
  ];

  for (const word of goodWords) {
    if (combined.includes(word)) {
      score += 2;
    }
  }

  for (const word of badWords) {
    if (combined.includes(word)) {
      score -= 3;
    }
  }

  return score;
}

function chooseBestVideo(items) {
  const usable = items
    .filter(
      (item) => item?.id?.videoId
    )
    .map((item) => ({
      item,
      score: scoreVideo(item),
    }))
    .sort(
      (a, b) => b.score - a.score
    );

  if (!usable.length) {
    return null;
  }

  const best = usable[0].item;

  const videoId =
    best.id.videoId;

  return {
    title:
      best.snippet?.title ??
      'YouTube Tutorial',

    url:
      `https://www.youtube.com/watch?v=${videoId}`,
  };
}

async function getSkills() {
  const { data, error } =
    await supabase
      .from('skills')
      .select(`
        id,
        name,
        category,
        subCategory,
        description,
        tutorial_title,
        tutorial_url
      `)
      .order('category', {
        ascending: true,
      })
      .order('name', {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function saveTutorial(
  skillId,
  tutorial
) {
  const { error } =
    await supabase
      .from('skills')
      .update({
        tutorial_title:
          tutorial.title,

        tutorial_url:
          tutorial.url,
      })
      .eq('id', skillId);

  if (error) {
    throw error;
  }
}

async function main() {
  const skills =
    await getSkills();

  console.log(
    `Found ${skills.length} skills.`
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (
    let index = 0;
    index < skills.length;
    index += 1
  ) {
    const skill = skills[index];

    console.log(
      `\n[${index + 1}/${skills.length}] ${skill.name}`
    );

    if (skill.tutorial_url) {
      console.log(
        'Already has tutorial. Skipping.'
      );

      skipped += 1;
      continue;
    }

    const query =
      buildSearchQuery(skill);

    console.log(
      `Search: ${query}`
    );

    try {
      const results =
        await searchYouTube(query);

      const tutorial =
        chooseBestVideo(results);

      if (!tutorial) {
        console.log(
          'No suitable tutorial found.'
        );

        failed += 1;
        continue;
      }

      console.log(
        `Found: ${tutorial.title}`
      );

      console.log(
        `URL: ${tutorial.url}`
      );

      await saveTutorial(
        skill.id,
        tutorial
      );

      console.log(
        'Saved to Supabase ✅'
      );

      updated += 1;
    } catch (error) {
      console.error(
        'Failed:',
        error
      );

      failed += 1;
    }

    await sleep(300);
  }

  console.log('\nFinished.');
  console.log(
    `Updated: ${updated}`
  );
  console.log(
    `Skipped: ${skipped}`
  );
  console.log(
    `Failed: ${failed}`
  );
}

main()
  .catch((error) => {
    console.error(
      'Script failed:',
      error
    );

    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => {
      process.exit(
        process.exitCode ?? 0
      );
    }, 200);
  });