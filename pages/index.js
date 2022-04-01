import { useEffect, useState } from 'react';
import Head from 'next/head'
import { Cloudinary } from '@cloudinary/url-gen';
import styles from '../styles/Home.module.scss'

const cloudinary = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

export default function Home() {
  const [imageSrc, setImageSrc] = useState();
  const [uploadData, setUploadData] = useState();

  const [transparentData, setTransparentData] = useState();

  const mainImage = uploadData && cloudinary.image(uploadData.public_id).toURL();
  const transparentImage = transparentData && cloudinary.image(transparentData.public_id).toURL()

  useEffect(() => {
    if ( !uploadData ) return;
    (async function run() {
      const results = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          image: uploadData.secure_url,
          options: {
            background_removal: 'cloudinary_ai'
          }
        })
      }).then(r => r.json());

      const transparentResult = await checkStatus();

      setTransparentData(transparentResult);

      async function checkStatus() {
        const resource = await fetch(`/api/resource/?publicId=${results.public_id}`).then(r => r.json());
        if (resource.info.background_removal.cloudinary_ai.status === 'pending') {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return await checkStatus();
        }
        return resource;
      }
    })();
  },[uploadData, setTransparentData]);

  /**
   * handleOnChange
   * @description Triggers when the file input changes (ex: when a file is selected)
   */

  function handleOnChange(changeEvent) {
    const reader = new FileReader();

    reader.onload = function(onLoadEvent) {
      setImageSrc(onLoadEvent.target.result);
      setUploadData(undefined);
    }

    reader.readAsDataURL(changeEvent.target.files[0]);
  }

  /**
   * handleOnSubmit
   * @description Triggers when the main form is submitted
   */

  async function handleOnSubmit(event) {
    event.preventDefault();

    const results = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: imageSrc
      })
    }).then(r => r.json());

    setUploadData(results);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Image Uploader</title>
        <meta name="description" content="Upload your image to Cloudinary!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Image Uploader
        </h1>

        <p className={styles.description}>
          Upload your image to Cloudinary!
        </p>

        <form className={styles.form} method="post" onChange={handleOnChange} onSubmit={handleOnSubmit}>
          <p>
            <input type="file" name="file" />
          </p>

          { imageSrc && !uploadData && (
            <img src={imageSrc} />
          )}

          { mainImage && (
            <img src={transparentImage || mainImage} />
          )}

          {imageSrc && !uploadData && (
            <p>
              <button>Upload Files</button>
            </p>
          )}

          {uploadData && (
            <code><pre>{JSON.stringify(uploadData, null, 2)}</pre></code>
          )}

          { uploadData && !transparentData && (
            <code><pre>Loading...</pre></code>
          )}

          {transparentData && (
            <code><pre>{JSON.stringify(transparentData, null, 2)}</pre></code>
          )}
        </form>
      </main>

      <footer className={styles.footer}>
        <p>Find the tutorial on <a href="https://spacejelly.dev/">spacejelly.dev</a>!</p>
      </footer>
    </div>
  )
}
