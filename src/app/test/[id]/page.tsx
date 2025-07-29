import { TestView } from "@/components/test-view";
import { notFound } from 'next/navigation';
import { AppHeader } from "@/components/app-header";

type TestPageProps = {
  params: {
    id: string;
  };
};

// This is a placeholder. You'll need to fetch real exam data.
const getExamById = async (id: string): Promise<any | null> => {
  console.log("Fetching exam with id:", id);
  // Replace this with your actual data fetching logic
  return null;
}


export default async function TestPage({ params }: TestPageProps) {
  const exam = await getExamById(params.id);

  if (!exam) {
    // You can either show a "not found" page or a more specific error.
    return (
      <div className="min-h-screen w-full flex flex-col bg-secondary">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Exam not found</h1>
            <p className="text-muted-foreground">The requested exam could not be found.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-secondary">
      <AppHeader />
      <TestView exam={exam} />
    </div>
  );
}
