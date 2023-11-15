module.exports = function (api) {
    const presets = [
        '@babel/preset-env',
      '@babel/preset-react',
    ];
    const plugins = [
      '@babel/plugin-syntax-jsx',
    ];
    api.cache(false);
  
    return {
      presets,
      plugins
    };
  };