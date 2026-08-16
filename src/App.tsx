import { ScrollProgress } from './components/ScrollProgress';
import { CustomizePanel } from './components/CustomizePanel';
import { ThemeProvider } from './design-system/theme';
import { Hero } from './sections/Hero';
import { WorkGrid } from './sections/WorkGrid';
import { About } from './sections/About';
import { Contact } from './sections/Contact';

const SECTIONS = [
  { id: 'hero', label: 'Intro' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export default function App() {
  return (
    <ThemeProvider>
      <ScrollProgress sections={SECTIONS} />
      <main>
        <Hero />
        <WorkGrid />
        <About />
        <Contact />
      </main>
      <CustomizePanel />
    </ThemeProvider>
  );
}
