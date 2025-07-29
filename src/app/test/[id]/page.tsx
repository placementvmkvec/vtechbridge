import { TestView } from "@/components/test-view";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { notFound } from 'next/navigation';

type TestPageProps = {
  params: {
    id: string;
  };
};

export default function TestPage({ params }: TestPageProps) {
  const exam = MOCK_EXAMS.find((e) => e.id === params.id);

  if (!exam) {
    notFound();
  }

  return <TestView exam={exam} />;
}
