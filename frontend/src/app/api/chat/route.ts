import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    // Send all messages in history as context, plus the current message
    const allSymptoms = history
    .filter((msg: any) => msg.role === "user")
    .map((msg: any) => msg.content)
    .join(" ") + " " + message;
    // Call the FastAPI backend
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms: allSymptoms }),
    });

    if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
    }

    const { data } = await response.json();
    data.symptoms_identified = data.symptoms_identified?.map((s: any) => s.symptom);
    console.log("symptoms_identified:", data.symptoms_identified);
    
    let reply = data.guidance || "I have analyzed your symptoms.";
    if (data.emergency_alert) {
      reply = `${data.emergency_alert}\n\n${reply}`;
    }

    return NextResponse.json({
      reply: reply,
      isActionable: true,
      assessment: data // optionally pass forward
    });
    
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to connect to the analysis engine." },
      { status: 500 }
    );
  }
}
