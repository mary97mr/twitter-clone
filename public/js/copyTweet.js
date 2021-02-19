const copyTweet = (tweetId) => {
    const temp = document.createElement("input");
    const tweet_url = "https://twitter-mary97mr.herokuapp.com/tweets/" + tweetId;
    document.body.appendChild(temp);
    temp.value = tweet_url;
    temp.select();   
    document.execCommand("copy");
    document.body.removeChild(temp);
}
