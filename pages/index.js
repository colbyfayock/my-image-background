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

const BACKGROUNDS = [
  'my-image-background-assets/the-office',
  'my-image-background-assets/moon-earth',
  'my-image-background-assets/this-is-fine',
  'my-image-background-assets/mario'
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const [imageSrc, setImageSrc] = useState();
  const [uploadData, setUploadData] = useState();

  const [transparentData, setTransparentData] = useState();
  const [background, setBackground] = useState();

  const mainImage = uploadData && cloudinary.image(uploadData.public_id).toURL();
  const transparentImage = transparentData && cloudinary.image(transparentData.public_id).toURL()
  let transformedImage;

  if ( transparentData && background ) {
    transformedImage = cloudinary.image(transparentData.public_id);

    transformedImage.addTransformation(`u_${background.replace('/', ':')},c_fill,w_1.0,h_1.0,fl_relative`);

    transformedImage = transformedImage.toURL();
  }

  useEffect(() => {
    if ( !uploadData ) return;

    setIsLoading(true);

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

      setIsLoading(false);

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

    setIsLoading(true);

    const results = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        image: imageSrc
      })
    }).then(r => r.json());

    setUploadData(results);

    setIsLoading(false);
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
          Background Image Changer
        </h1>

        <p className={styles.description}>



          {isLoading && !mainImage && <>Uploading image...</>}

          {isLoading && mainImage && !transparentImage && <>Removing background...</>}

          {!isLoading && !mainImage && <>Upload your image then choose your background!</>}

          {!isLoading && transparentImage && !background && <>Select your background.</> }

          {!isLoading && transformedImage && <>Delivering your new image.</> }
        </p>

        <div className={styles.content}>
          <div className={styles.image}>
            { imageSrc && !uploadData && (
              <img src={imageSrc} />
            )}

            { mainImage && (
              <img src={transformedImage || transparentImage || mainImage} />
            )}
          </div>
          <form className={styles.form} method="post" onChange={handleOnChange} onSubmit={handleOnSubmit}>
            <p>
              <input type="file" name="file" />
            </p>

            {transparentImage && (
              <>
                <h3>Backgrounds</h3>
                <ul style={{
                  display: 'flex',
                  justifyContent: 'center',
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}>
                  {BACKGROUNDS.map(backgroundId => {
                    return (
                      <li key={backgroundId} style={{ margin: '0 .5em' }}>
                        <button
                          style={{
                            padding: 0,
                            cursor: 'pointer',
                            border: background === backgroundId ? 'solid 3px blueviolet' : 0
                          }}
                          onClick={() => setBackground(backgroundId)}
                        >
                          <img
                            style={{ display: 'block' }}
                            width={100}
                            src={cloudinary.image(backgroundId).resize('w_200').toURL()}
                            alt="backgroundId"
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {imageSrc && !uploadData && (
              <p>
                <button>Upload Files</button>
              </p>
            )}
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Find the tutorial on <a href="https://mediajams.dev/">mediajams.dev</a>!</p>
      </footer>
    </div>
  )
}
