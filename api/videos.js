// Vercel Serverless Function — Vimeo API proxy
// Fetches Sara's videos from Vimeo and maps them to portfolio format

const CATEGORY_TAGS = ['character', 'motion', '2d', 'experimental'];

function mapVideo(video) {
  const id = video.uri.replace('/videos/', '');
  const tags = (video.tags || []).map(t => t.name.toLowerCase());
  const categories = tags.filter(t => CATEGORY_TAGS.includes(t));
  const featured = tags.includes('featured');

  // Best thumbnail (largest available)
  const pics = video.pictures?.sizes || [];
  const thumb = pics[pics.length - 1]?.link || '';

  // Duration in "m:ss min" format
  const totalSecs = video.duration || 0;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const duration = totalSecs > 0 ? `${mins}:${secs.toString().padStart(2, '0')} min` : '';

  const year = new Date(video.created_time).getFullYear();

  // First line of description = short description
  const desc = (video.description || '').trim();
  const shortDesc = desc.split('\n')[0].slice(0, 150);

  // Parse tools from a line like "Herramientas: After Effects, Toon Boom"
  const toolsMatch = desc.match(/(?:tools|herramientas)\s*:\s*(.+)/i);
  const tools = toolsMatch
    ? toolsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return {
    id: `vimeo-${id}`,
    title: video.name || 'Sin título',
    shortDescription: shortDesc,
    description: desc,
    thumbnail: thumb,
    year,
    duration,
    category: categories.length > 0 ? categories : ['motion'],
    featured,
    tools,
    client: '',
    media: { type: 'video', url: `https://vimeo.com/${id}` }
  };
}

module.exports = async function handler(req, res) {
  const token = process.env.VIMEO_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'VIMEO_TOKEN no configurado en Vercel' });
  }

  try {
    const response = await fetch(
      'https://api.vimeo.com/me/videos' +
      '?fields=uri,name,description,duration,created_time,pictures,tags' +
      '&per_page=50&sort=date&direction=desc',
      {
        headers: {
          Authorization: `bearer ${token}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Vimeo respondió con ${response.status}`);
    }

    const data = await response.json();
    const projects = (data.data || []).map(mapVideo);

    // Featured primero, luego por año descendente
    projects.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.year - a.year;
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({ projects });

  } catch (err) {
    console.error('[api/videos]', err.message);
    res.status(500).json({ error: err.message });
  }
};
