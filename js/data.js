/**
 * DATA LOADER — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Loads projects.json and makes data available to the entire app.
 * All other modules depend on this being initialized first.
 */

const DataLoader = (() => {
  let _data = null;

  /**
   * Fetch and cache the projects data.
   * @returns {Promise<Object>} The full data object from projects.json
   */
  async function load() {
    if (_data) return _data;
    try {
      // Perfil y categorías siempre vienen del JSON estático
      const staticRes = await fetch('data/projects.json');
      if (!staticRes.ok) throw new Error(`HTTP ${staticRes.status}`);
      const staticData = await staticRes.json();

      // Proyectos: intenta Vimeo API, si falla usa el JSON
      let projects = staticData.projects || [];
      try {
        const vimeoRes = await fetch('/api/videos');
        if (vimeoRes.ok) {
          const vimeoData = await vimeoRes.json();
          if (Array.isArray(vimeoData.projects) && vimeoData.projects.length > 0) {
            projects = vimeoData.projects;
          }
        }
      } catch (_) {
        // Sin Vimeo token o en desarrollo local → usa projects.json
      }

      _data = {
        animator:   staticData.animator   || {},
        categories: staticData.categories || [],
        projects
      };

      return _data;
    } catch (err) {
      console.error('[DataLoader] Failed to load portfolio data:', err);
      throw err;
    }
  }

  /** Get cached data — throws if not yet loaded */
  function get() {
    if (!_data) throw new Error('[DataLoader] Data not loaded. Call load() first.');
    return _data;
  }

  /** Get the animator profile */
  function getAnimator() {
    return get().animator;
  }

  /** Get all projects */
  function getProjects() {
    return get().projects;
  }

  /** Get all categories */
  function getCategories() {
    return get().categories;
  }

  /**
   * Get projects filtered by category.
   * @param {string} categoryId - 'all' returns everything
   */
  function getProjectsByCategory(categoryId) {
    const projects = getProjects();
    if (categoryId === 'all') return projects;
    return projects.filter(p => p.category.includes(categoryId));
  }

  /** Get a single project by ID */
  function getProjectById(id) {
    return getProjects().find(p => p.id === id) || null;
  }

  return { load, get, getAnimator, getProjects, getCategories, getProjectsByCategory, getProjectById };
})();

export default DataLoader;
