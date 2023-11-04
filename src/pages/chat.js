import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const inter = Inter({ subsets: ['latin'] })


const Chat = () => {
    const [chats, setChats] = useState([]);
    const [input, setInput] = useState("");
    const [indexName, setIndexName] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [indexLoading, setIndexLoading] = useState(false);
    const router = useRouter()

    useEffect(() => {
        const fetchCurrentIndex = async () => {
            try {
                setIndexLoading(true)
                const response = await fetch("/api/v1/listIndex", {
                    method: "GET",
                });
                const data = await response.json();
                if (data.success) {
                    setIndexName(data?.data?.[0]);
                    if(!data?.data?.[0]) router.push("/upload");
                    setIndexLoading(false);
                } else {
                    alert("Unable to upload.");
                    setIndexLoading(false);
                }
            } catch (err) {
                setIndexLoading(false)
                console.error(err)
            }

        }
        fetchCurrentIndex();

    }, [])

    const handleSubmit = (e) => {
        e.preventDefault();
        const newChat = {
            sent: input,
        };
        setChats((prevChats) => [...prevChats, newChat]);
        setInput("");
        query();
    }

    const query = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/v1/query", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: input, index: indexName }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    setChats((prevChats) => {
                        const updatedChats = [...prevChats];
                        updatedChats[updatedChats.length - 1]["received"] = data.message?.text || null;
                        return updatedChats;
                    });
                    if(true)textToSpeech(data.message?.text);
                } else {
                    alert("Failed.");
                }
            } else {
                alert("Failed to fetch data.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while processing your request.");
        } finally {
            setLoading(false);
        }
    }


    const handleInputChange = (e) => {
        setInput(e?.target?.value)
    }

    const onKeyPress =(_e)=>{
        let key = window.event.keyCode;
        if(key === 13){
            handleSubmit(_e);
        }
    }
    const textToSpeech=(text)=>{
        let utterance = new SpeechSynthesisUtterance();
        utterance.text = text;
        console.log(window.speechSynthesis.getVoices())
        utterance.voice = window.speechSynthesis.getVoices()[1];
        window.speechSynthesis.speak(utterance);
    }



    return (
        <div className={`flex min-h-screen flex-col items-center  ${inter.className} h-screen`}>
            <div className="mt-5  text-gray-600 dark:text-white">
                <h5 className="font-bold flex"><span className="text-xl">AskAI{" / "}</span>
                    <img src="/pdf.png" alt="PDF Logo" className="w-4 h-4 mx-2 self-center" />
                    {!indexLoading ?<Link className='!text-l self-center underline' href="/upload">{indexName}.pdf</Link>
                    :
                    <><svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 self-center text-black animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                            </svg>
                                <span className="self-center">Loading...</span>
                            </>
                    }
                </h5>
            </div>
            <div className='h-3/4 w-4/6 overflow-y-scroll mt-5'>
                <div className="flex flex-col justify-center mx-3">
                    {chats.map((message, index) => (
                        <div key={index}>
                            <div className="flex items-end justify-end mt-2">
                                <div className="text-gray-600 text-xs mr-2 self-center	">You</div>
                                <div className="bg-gray-400 text-white rounded-lg p-2 max-w-full ml-2">
                                    {message?.sent}
                                </div>
                            </div>
                            <div className="flex items-start mt-2">
                                <div className="bg-slate-800 text-white rounded-lg p-2 max-w-full">
                                    {isLoading && (index === chats.length - 1) ? (
                                        <div className="loading-animation">Loading...</div>
                                    ) : (
                                        message?.received
                                    )}
                                    </div>
                                <div className="ml-2 text-gray-600 text-xs self-center	">AI</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <form disabled={indexLoading} className=' w-4/6 ' onSubmit={handleSubmit}>
                <label htmlFor="chat" className="sr-only">Your query</label>
                <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <textarea id="chat" rows="3" onKeyDown={onKeyPress} className="w-full block mx-4 p-2.5 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Your message..." value={input} onChange={handleInputChange}></textarea>
                    <button disabled={isLoading} type="submit" className="inline-flex justify-center p-2 text-slate-600 rounded-full cursor-pointer hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-gray-600">
                        <svg className="w-5 h-5 rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                            <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
                        </svg>
                        <span className="sr-only">Send message</span>
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Chat;