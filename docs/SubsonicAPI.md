## getRandomSongs

url: `http://your-server/rest/getRandomSongs`

Returns random songs matching the given criteria.

| Parameter | Required | Default | Comment |
|---|---|---|---|
| size | No | 10 | The maximum number of songs to return. Max 500. |
| genre | No | | Only returns songs belonging to this genre. |
| fromYear | No | | Only return songs published after or in this year. |
| toYear | No | | Only return songs published before or in this year. |
| musicFolderId | No | | Only return songs in the music folder with the given ID. See getMusicFolders. |


Returns a <subsonic-response> element with a nested <randomSongs> element on success. Example.

```xml
<subsonic-response xmlns="http://subsonic.org/restapi" status="ok" version="1.4.0">
  <randomSongs>
    <song id="111" parent="11" title="Dancing Queen" isDir="false" album="Arrival" artist="ABBA" track="7" year="1978" genre="Pop" coverArt="24" size="8421341" contentType="audio/mpeg" suffix="mp3" duration="146" bitRate="128" path="ABBA/Arrival/Dancing Queen.mp3"/>
    <song id="112" parent="11" title="Money, Money, Money" isDir="false" album="Arrival" artist="ABBA" track="7" year="1978" genre="Pop" coverArt="25" size="4910028" contentType="audio/flac" suffix="flac" transcodedContentType="audio/mpeg" transcodedSuffix="mp3" duration="208" bitRate="128" path="ABBA/Arrival/Money, Money, Money.mp3"/>
  </randomSongs>
</subsonic-response>
```