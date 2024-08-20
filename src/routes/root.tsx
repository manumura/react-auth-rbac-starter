import Navbar from '../components/Navbar';
import { Providers } from '../components/Providers';

export default function Root() {
  return (
    <html lang='en' data-theme='emerald'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>Welcome to MyApp !</title>
        <meta name='description' content='Welcome to MyApp !' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body>
        <Providers>
          <Navbar />
        </Providers>
      </body>
    </html>
  );
}
