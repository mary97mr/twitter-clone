const copyTweet = (tweetId) => {
    const temp = document.createElement("input");
    const tweet_url = "http://localhost:3000/tweets/" + tweetId;
    document.body.appendChild(temp);
    temp.value = tweet_url;
    temp.select();   
    document.execCommand("copy");
    document.body.removeChild(temp);
}
