import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const inter = Inter({ subsets: ['latin'] })


const Upload = () => {
    const [page, setPage] = useState("select-type");
    const [type, setType] = useState();
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [file, setFile] = useState();
    const [existingIndex, setExistingIndex] = useState([]);
    const [text, setText] = useState("")
    const router = useRouter();
    const inputRef = useRef(null);


    useEffect(() => {

        fetchListIndex();
    }, [])

    const fetchListIndex = async () => {
        setLoading(true);
        const response = await fetch("/api/v1/listIndex", {
            method: "GET",
        });
        const data = await response.json();
        if (data.success) {
            setExistingIndex(data.data);
            setLoading(false);
        } else {
            alert("Unable to fetch." + " Error: " + data.error);
            setLoading(false);
        }
    }

    const selectChange = () => {
        if (page === "select-type" && type !== "choose") {
            setPage(type);
        }
        if (page === "select-type" || page === "upload-file") {
            setText("");
        }
        if (page === "select-type" || page === "upload-text" ) {
            setFile(null);
        }
    }

    async function encryptPdfToBase64(pdfFile) {
        // Read the PDF file as a binary string.
        const binaryData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsArrayBuffer(pdfFile);
        });

        // Encode the binary string to base64.
        const base64EncodedString = Buffer.from(binaryData).toString('base64');

        // Return the base64 encoded string.
        return base64EncodedString;
    }


    const uploadData = async (requestData) => {
        try {
            setLoading(true);
            const response = await fetch("api/v1/uploadData", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            const data = await response.json();
            if (data.success) {
                router.push('/chat');
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    
    const uploadFile = async () => {
        const base64EncodedString = await encryptPdfToBase64(file);
        const file_name = file.name;
        const file_extension = file.type;
        const requestData = { file: base64EncodedString, fileName: file_name, fileType: file_extension, isFile: true };
        uploadData(requestData);
    }
    
    const uploadText = async () => {
        let file_type;
        if(page === "upload-text"){
            file_type = "application/raw-text"
        }
        const requestData = {
            input: text,
            isFile: false,
            fileName: page === "upload-text" ?"My Content":text,
            fileType:  file_type,
        };
        uploadData(requestData);
    }

    function handleFileChange(event) {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        console.log('Selected File:', selectedFile);
    }

    async function handleDelete(fileName) {
        setDeleteLoading(true)
        const response = await fetch("/api/v1/deleteIndex", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index: fileName }),
        });
        const data = await response.json();
        if (data.success) {
            fetchListIndex();
            setDeleteLoading(false);
        } else {
            alert("Unable to delete.");
            setDeleteLoading(false);
        }
    }


    return (
        <div className={`flex min-h-screen flex-col items-center justify-center ${inter.className}`}>
            {page === "select-type" && (existingIndex?.length === 0) &&
                <div id="select-type" >
                    <label htmlFor="countries" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select Type</label>
                    <select id="countries" className="w-80 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={e => setType(e.target.value)} value={type} defaultValue={"choose"}>
                        <option value="choose"  className="text-gray-500">Choose a type</option>
                        <option value="upload-file" >Upload a File</option>
                        <option value="upload-text" >Upload Raw Text</option>
  
                    </select>
                    <button type="button" disabled={loading} className="w-80 mt-5 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" onClick={selectChange}>{loading ? "Checking for existing file..." : "Submit"}</button>
                </div>
            }
            {page === "select-type" && (existingIndex?.length > 0) &&
                <>
                    {existingIndex?.map((val, index) => {
                        return <div className="block w-96   max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                            <div className="flex items-center" id={index}>
                                <img
                                    src="/pdf.png" // Replace with the actual path to your PDF logo image
                                    alt="PDF Logo"
                                    className="w-8 h-8 mr-2"
                                />
                                <h5 className="text-lg font-bold tracking-tight text-gray-600 dark:text-white w-80	truncate ">
                                    {val}
                                </h5>
                                <div className='w-7 h-7 self-end cursor-pointer' onClick={_=>handleDelete(val)}>
                                    {!deleteLoading ? <img
                                        src="/delete-icon.png"
                                        alt="Delete Logo"
                                        title='Delete'
                                    // className="w-6 h-6" 
                                    /> :
                                        <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 dark:text-white text-black animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                                        </svg>
                                    }
                                </div >
                            </div>
                        </div>
                    })}
                    < button type="button" className="w-96 mt-5 mx-1 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" onClick={() => router.push('/chat')}>Go to chat</button>
                </>
            }

            {
                page === "upload-file" &&
                <div id="upload-file">
                    <div className="flex items-center justify-center w-96">
                        {!file && <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                </svg>
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Only .pdf, .txt, .csv are supported.</p>
                            </div>
                            <input ref={inputRef} disabled={loading} id="dropzone-file" type="file" className="hidden" accept=".pdf,.csv,.txt" value={file} onChange={handleFileChange} />
                        </label>}
                        {file &&
                            <div className="block w-96   max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                                <div className="flex items-center">
                                    <img
                                        src="/pdf.png"
                                        alt="PDF Logo"
                                        className="w-8 h-8 mr-2"
                                    />
                                    <h5 className="text-lg font-bold tracking-tight text-gray-600 dark:text-white w-80	truncate " title={file.name}>
                                        {file.name}
                                    </h5>
                                </div>
                            </div>
                        }

                    </div>
                    <div className="flex flex-col gap-1 mt-5">
                        <button disabled={loading || !file} type="button" className="w-96  text-white dark:text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" onClick={uploadFile}>
                            {loading ? <><svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-black dark:text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                            </svg>
                                Loading...
                            </> :
                                <>
                                    Submit
                                </>}
                        </button>
                        <button disabled={loading} type="button" className="w-96 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" onClick={() => setPage("select-type")}>Back</button>
                    </div>
                </div>
            }

        </div >
    )
}

export default Upload;