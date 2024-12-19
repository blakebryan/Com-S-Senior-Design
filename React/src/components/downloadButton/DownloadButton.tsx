import React from 'react';
import { Button } from 'react-bootstrap';

/**
 * Asynchronously downloads a file from the given URL and saves it with the specified filename.
 *
 * @param {string} url - The URL from which to download the file.
 * @param {string} as - The name to use when saving the file locally.
 * @returns {() => Promise<void>} A function that, when executed, initiates the file download.
 */
const handleDownload = (url: string, as: string): () => Promise<void> => {
  return async () => {
    try {
      // Fetch the file from the URL
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');

      // Convert the response to a Blob
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', as);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
  };
};

/**
 * React component for rendering a download button.
 *
 * @param {object} props - The properties for the DownloadButton component.
 * @param {string} props.path - The URL of the file to be downloaded.
 * @param {string} props.as - The name to use when saving the file locally.
 * @returns {JSX.Element} The rendered download button component.
 */
export default function DownloadButton(props: { path: string; as: string }): JSX.Element {
  return (
      <Button className="nextButton" onClick={handleDownload(props.path, props.as)}>
        Download
      </Button>
  );
}
