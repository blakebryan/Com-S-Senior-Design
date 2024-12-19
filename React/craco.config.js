/**
 * @file webpack-dev-server-config.js
 * This module customizes the webpack development server configuration.
 * It removes deprecated options, replaces them with new options, and sets up custom middlewares.
 * @author Brady Bargren. ISU ID: az2997
 */

module.exports = {
    /**
     * Modifies the webpack development server configuration.
     *
     * @param {Object} devServerConfig - The initial webpack-dev-server configuration.
     * @param {Object} context - Additional context provided to the configuration function.
     * @param {string} context.env - The current environment (e.g., development or production).
     * @param {Object} context.paths - Paths related to the project.
     * @param {Object} context.proxy - Proxy configuration for the dev server.
     * @param {string} context.allowedHost - Allowed host for the dev server.
     * @returns {Object} The modified webpack-dev-server configuration.
     */
    devServer: (devServerConfig, { env, paths, proxy, allowedHost }) => {
        // Remove deprecated options
        devServerConfig.onAfterSetupMiddleware = undefined;
        devServerConfig.onBeforeSetupMiddleware = undefined;
        delete devServerConfig.onBeforeSetupMiddleware;
        delete devServerConfig.onAfterSetupMiddleware;

        /**
         * Sets up middlewares for the webpack development server using the new `setupMiddlewares` option.
         *
         * @param {Array} middlewares - The array of existing middlewares.
         * @param {Object} devServer - The webpack development server instance.
         * @throws {Error} If the `devServer` instance is not defined.
         * @returns {Array} The modified array of middlewares.
         */
        devServerConfig.setupMiddlewares = (middlewares, devServer) => {
            if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
            }

            // Example middleware: log each incoming request URL to the console
            devServer.app.use((req, res, next) => {
                console.log(`Request URL: ${req.url}`);
                next();
            });

            return middlewares;
        };

        return devServerConfig;
    },
};
