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
      const response = await fetch('data/projects.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      _data = await response.json();
      return _data;
    } catch (err) {
      console.error('[DataLoader] Failed to load projects.json:', err);
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
