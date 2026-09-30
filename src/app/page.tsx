import { redirect } from 'next/navigation';

export default function Home() {
  // The campaign entry point is the (tokenized) login page.
  redirect('/login');
}
