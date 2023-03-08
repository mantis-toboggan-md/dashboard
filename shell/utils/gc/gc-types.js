module.exports = {
  GC_DEFAULTS: {
    enabled: false,

    // When GC Runs
    enabledInterval:   true,
    interval:          1 * 60 * 5,
    enabledOnNavigate: true,

    // How GC handles resources when GC'ing
    ageThreshold:   1 * 60 * 2,
    countThreshold: 500,
  }
};
