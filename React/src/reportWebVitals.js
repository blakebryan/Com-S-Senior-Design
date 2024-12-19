/**
 * Reports web vitals performance metrics.
 *
 * This function imports the `web-vitals` library dynamically and collects core web vitals metrics such as:
 * - Cumulative Layout Shift (CLS)
 * - First Input Delay (FID)
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Time to First Byte (TTFB)
 *
 * If a valid callback function is provided, each metric is passed to the callback as it is measured.
 *
 * @function
 * @param {Function} onPerfEntry - A callback function to handle performance metric entries.
 * The function will be called with each metric's data.
 *
 * @example
 * // Example usage in a React application
 * import reportWebVitals from './reportWebVitals';
 *
 * reportWebVitals(metric => {
 *   console.log('Web Vital Metric:', metric);
 * });
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
