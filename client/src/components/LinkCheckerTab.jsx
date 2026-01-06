import { useState } from "react";

function LinkCheckerTab(){
    const [url, setUrl] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleClick = async () => {
        //Reset states
       setResult(null);
       setLoading(true);
       setError("");

       //try-catch block for sending POST request
       try {
        const res = await fetch("http://localhost:5000/api/link/check", {
            method: "POST",
            headers: {"Content-Type": "application/json",
            },
            body: JSON.stringify({url}),
       });
       //if server returned error
       if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
       }
       //parse JSON response and save as result
       const data = await res.json();
       setResult(data);
       //catch error and show message
        } catch (err) {
            setError(err.message || "Something went wrong...")
        //finally stop loading state
        } finally {
            setLoading(false);
        }
    };
    //UI rendering
    return(
        <header>
            <h1>Link Checker</h1>
            <input 
                type="text"
                placeholder="Paste link here"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            {/*loading and showing result at the end of loading*/}
            <button onClick={handleClick}>{loading? "Checking link..." : "Check link"}</button>

            {/*error text*/}
            {error && <p style={{color:"red"}}>{error}</p>}

            {/*result box*/}
            {result && (
            <div>
                <h2>Verdict: {result.verdict}</h2>
                <p><strong>Score(1-5): </strong>{result.score}</p>
                <ul>
                    {result.reasons?.map((r, i) => (
                        <li key={i}>{r}</li>
                    ))}
                </ul>

                <p>
                    <strong>Recommendation:</strong> {result.recommendation}
                </p>
            </div>
            )}
        </header>
    );
}
export default LinkCheckerTab;