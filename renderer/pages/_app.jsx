import React from 'react'

import '../styles/globals.css';
import '../styles/general.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp