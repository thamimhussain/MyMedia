import React, { useState, useEffect } from 'react';
import MediaEntry from './MediaEntry';
import stringSimilarity from 'string-similarity-js';
import '../style/MediaList.css';

const MediaList = () => {
    const [mediaList, setMediaList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [newEntry, setNewEntry] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [addingEntry, setAddingEntry] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5000/media");
                const data = await response.json();

                const mappedData = data.map((item) => ({
                    id: item.id || item._id || '',
                    title: item.title || '',
                    media_type: item.media_type || item.mediaType || '',
                    status: item.status || '',
                    format: item.format || '',
                    progress: item.progress || '',
                    score: item.score !== undefined ? item.score : null,
                    comment: item.comment || '',
                    description: item.description || '',
                    coverImage: item.coverImage || '',
                    episodes: item.episodes || '',
                    genres: item.genres || [],
                    author_name: item.author_name || [],
                    publish_year: item.publish_year || '',
                    release_date: item.release_date || '',
                }));

                setMediaList(mappedData);
            } catch (e) {
                console.log(e);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async () => {
        try {
            const aniListQuery = {
                query: `
                query ($search: String) {
                    Page(perPage: 10) {
                        media(search: $search, type: ANIME) {
                            id
                            title {
                                romaji
                                english
                                native
                            }
                            type
                            format
                            status
                            description
                            episodes
                            coverImage {
                                large
                            }
                            genres
                        }
                    }
                }`,
                variables: { search: searchQuery },
            };

            const aniListResponse = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aniListQuery),
            });

            const aniListData = await aniListResponse.json();
            const aniListResults = aniListData.data.Page.media.map((item) => ({
                id: `anilist-${item.id}`,
                title: item.title.english || item.title.romaji || item.title.native,
                media_type: item.type,
                format: item.format,
                status: item.status,
                progress: '',
                score: '',
                comment: '',
                description: item.description,
                episodes: item.episodes,
                coverImage: item.coverImage.large,
                genres: item.genres,
            }));

            const apiKey = process.env.REACT_APP_TMDB_API_KEY;
            const tmdbResponse = await fetch(
                `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${searchQuery}`
            );


            const tmdbData = await tmdbResponse.json();
            const tmdbResults = tmdbData.results.map((item) => ({
                id: `tmdb-${item.id}`,
                title: item.title || item.name,
                media_type: item.media_type === 'movie' ? 'Movie' : 'TV Show',
                format: 'Video',
                status: 'Released',
                progress: '',
                score: '',
                comment: '',
                description: item.overview,
                release_date: item.release_date || item.first_air_date,
                coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            }));

            const openLibraryResponse = await fetch(
                `https://openlibrary.org/search.json?title=${searchQuery}`
            );
            const openLibraryData = await openLibraryResponse.json();
            const openLibraryResults = openLibraryData.docs.slice(0, 10).map((item) => ({
                id: `openlibrary-${item.key}`,
                title: item.title,
                media_type: 'Book',
                format: 'Print',
                status: 'Published',
                progress: '',
                score: '',
                comment: '',
                description: item.first_sentence ? item.first_sentence : null,
                author_name: item.author_name,
                publish_year: item.first_publish_year,
                coverImage: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : '',
            }));

            const combinedResults = [...aniListResults, ...tmdbResults, ...openLibraryResults];
            const sortedResults = combinedResults.sort((a, b) => {
                const scoreA = stringSimilarity(a.title.toLowerCase(), searchQuery.toLowerCase());
                const scoreB = stringSimilarity(b.title.toLowerCase(), searchQuery.toLowerCase());
                return scoreB - scoreA;
            });

            setSearchResults(sortedResults.slice(0, 10));
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    const handleAddFromSearch = (item) => {
        setAddingEntry({
            ...item,
            status: '',
            progress: '',
            score: '',
            comment: '',
        });
        setIsPopupOpen(false);
    };

    const handleAddFromSearchSubmit = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/media", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addingEntry),
            });

            const addedEntry = await response.json();

            const mappedEntry = {
                id: addedEntry.id || addedEntry._id || addingEntry.id,
                title: addedEntry.title || addingEntry.title,
                media_type: addedEntry.media_type || addedEntry.mediaType || addingEntry.media_type,
                status: addedEntry.status || addingEntry.status,
                format: addedEntry.format || addingEntry.format,
                progress: addedEntry.progress || addingEntry.progress,
                score: addedEntry.score !== undefined ? addedEntry.score : addingEntry.score,
                comment: addedEntry.comment || addingEntry.comment,
                description: addedEntry.description || addingEntry.description,
                coverImage: addedEntry.coverImage || addingEntry.coverImage,
                episodes: addedEntry.episodes || addingEntry.episodes,
                genres: addedEntry.genres || addingEntry.genres,
                author_name: addedEntry.author_name || addingEntry.author_name,
                publish_year: addedEntry.publish_year || addingEntry.publish_year,
                release_date: addedEntry.release_date || addingEntry.release_date,
            };

            setMediaList((prevList) => [...prevList, mappedEntry]);
            setAddingEntry(null);
            setSearchResults([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Error adding entry from search:', error);
        }
    };

    const handleAddManual = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/media", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry),
            });

            const addedEntry = await response.json();

            const mappedEntry = {
                id: addedEntry.id || addedEntry._id || newEntry.id,
                title: addedEntry.title || newEntry.title,
                media_type: addedEntry.media_type || addedEntry.mediaType || newEntry.media_type,
                status: addedEntry.status || newEntry.status,
                format: addedEntry.format || newEntry.format,
                progress: addedEntry.progress || newEntry.progress,
                score: addedEntry.score !== undefined ? addedEntry.score : newEntry.score,
                comment: addedEntry.comment || newEntry.comment,
                description: addedEntry.description || newEntry.description,
                coverImage: addedEntry.coverImage || newEntry.coverImage,
                episodes: addedEntry.episodes || newEntry.episodes,
                genres: addedEntry.genres || newEntry.genres,
                author_name: addedEntry.author_name || newEntry.author_name,
                publish_year: addedEntry.publish_year || newEntry.publish_year,
                release_date: addedEntry.release_date || newEntry.release_date,
            };

            setMediaList((prevList) => [...prevList, mappedEntry]);
            setIsAdding(false);
            setNewEntry({});
        } catch (error) {
            console.error('Error adding manual entry:', error);
        }
    };

    const handleEdit = (id) => {
        const entryToEdit = mediaList.find((entry) => entry.id === id);
        setEditingEntry({ ...entryToEdit });
        setIsEditing(true);
    };

    const handleUpdate = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/media/${editingEntry.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingEntry),
            });

            const updatedEntry = await response.json();

            const mappedEntry = {
                id: updatedEntry.id || updatedEntry._id || editingEntry.id,
                title: updatedEntry.title || editingEntry.title,
                media_type: updatedEntry.media_type || updatedEntry.mediaType || editingEntry.media_type,
                status: updatedEntry.status || editingEntry.status,
                format: updatedEntry.format || editingEntry.format,
                progress: updatedEntry.progress || editingEntry.progress,
                score: updatedEntry.score !== undefined ? updatedEntry.score : editingEntry.score,
                comment: updatedEntry.comment || editingEntry.comment,
                description: updatedEntry.description || editingEntry.description,
                coverImage: updatedEntry.coverImage || editingEntry.coverImage,
                episodes: updatedEntry.episodes || editingEntry.episodes,
                genres: updatedEntry.genres || editingEntry.genres,
                author_name: updatedEntry.author_name || editingEntry.author_name,
                publish_year: updatedEntry.publish_year || editingEntry.publish_year,
                release_date: updatedEntry.release_date || editingEntry.release_date,
            };

            setMediaList((prevList) =>
                prevList.map((entry) => (entry.id === mappedEntry.id ? mappedEntry : entry))
            );
            setIsEditing(false);
            setEditingEntry(null);
        } catch (error) {
            console.error('Error updating entry:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://127.0.0.1:5000/media/${id}`, { method: 'DELETE' });
            setMediaList((prevList) => prevList.filter((entry) => entry.id !== id));
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    useEffect(() => {
        if (isPopupOpen) {
            document.body.classList.add('popup-open');
        } else {
            document.body.classList.remove('popup-open');
        }
    }, [isPopupOpen]);

    return (
        <div className="media-list-container">
            <h1 className="media-list-title">My Media Tracker</h1>

            {/* Add Entry from Search Form */}
            {addingEntry && (
                <div className="add-entry-form">
                    <h2>Add New Entry</h2>
                    <input
                        name="title"
                        placeholder="Title"
                        value={addingEntry.title}
                        readOnly
                    />
                    <input
                        name="media_type"
                        placeholder="Media Type"
                        value={addingEntry.media_type}
                        readOnly
                    />
                    <input
                        name="status"
                        placeholder="Status (e.g., Watching, Completed, Dropped)"
                        value={addingEntry.status}
                        onChange={(e) => setAddingEntry({ ...addingEntry, status: e.target.value })}
                    />
                    <input
                        name="progress"
                        placeholder="Progress"
                        value={addingEntry.progress}
                        onChange={(e) => setAddingEntry({ ...addingEntry, progress: e.target.value })}
                    />
                    <input
                        name="score"
                        placeholder="Score"
                        type="number"
                        value={addingEntry.score}
                        onChange={(e) => setAddingEntry({ ...addingEntry, score: e.target.value })}
                    />
                    <input
                        name="comment"
                        placeholder="Comment"
                        value={addingEntry.comment}
                        onChange={(e) => setAddingEntry({ ...addingEntry, comment: e.target.value })}
                    />
                    <button onClick={handleAddFromSearchSubmit}>Submit</button>
                    <button onClick={() => setAddingEntry(null)}>Cancel</button>
                </div>
            )}

            {/* Manual Add Entry */}
            {isAdding && (
                <div className="add-entry-form">
                    <h2>Add New Entry</h2>
                    <input
                        name="title"
                        placeholder="Title"
                        onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    />
                    <input
                        name="media_type"
                        placeholder="Media Type"
                        onChange={(e) => setNewEntry({ ...newEntry, media_type: e.target.value })}
                    />
                    <input
                        name="status"
                        placeholder="Status (e.g., Watching, Completed, Dropped)"
                        onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                    />
                    <input
                        name="progress"
                        placeholder="Progress"
                        onChange={(e) => setNewEntry({ ...newEntry, progress: e.target.value })}
                    />
                    <input
                        name="score"
                        placeholder="Score"
                        type="number"
                        onChange={(e) => setNewEntry({ ...newEntry, score: e.target.value })}
                    />
                    <input
                        name="comment"
                        placeholder="Comment"
                        onChange={(e) => setNewEntry({ ...newEntry, comment: e.target.value })}
                    />
                    <button onClick={handleAddManual}>Submit</button>
                    <button onClick={() => setIsAdding(false)}>Cancel</button>
                </div>
            )}

            <button className="add-entry-button" onClick={() => setIsAdding(true)}>Add Entry</button>

            {/* Edit Entry Form */}
            {isEditing && (
                <div className="edit-entry-form">
                    <h2>Edit Entry</h2>
                    <input
                        name="title"
                        value={editingEntry.title || ''}
                        onChange={(e) =>
                            setEditingEntry({ ...editingEntry, title: e.target.value })
                        }
                    />
                    <input
                        name="media_type"
                        value={editingEntry.media_type || ''}
                        onChange={(e) =>
                            setEditingEntry({ ...editingEntry, media_type: e.target.value })
                        }
                    />
                    <input
                        name="status"
                        value={editingEntry.status || ''}
                        onChange={(e) =>
                            setEditingEntry({ ...editingEntry, status: e.target.value })
                        }
                    />
                    <input
                        name="progress"
                        value={editingEntry.progress || ''}
                        onChange={(e) =>
                            setEditingEntry({ ...editingEntry, progress: e.target.value })
                        }
                    />
                    <input
                        name="score"
                        type="number"
                        value={editingEntry.score || ''}
                        onChange={(e) =>
                            setEditingEntry({ ...editingEntry, score: e.target.value })
                        }
                    />
                    <input
                        name="comment"
                        value={editingEntry.comment || ''}
                        onChange={(e) =>
                            setEditingEntry({ ...editingEntry, comment: e.target.value })
                        }
                    />
                    <button onClick={handleUpdate}>Update</button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            )}

            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search for media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="search-results">
                    <h2>Search Results</h2>
                    {searchResults.map((result, index) => (
                        <div key={index} className="search-result-item">
                            <span onClick={() => { setSelectedItem(result); setIsPopupOpen(true); }}>
                                <strong>{result.title}</strong> ({result.media_type}, {result.format})
                            </span>
                            <button onClick={() => handleAddFromSearch(result)}>Add to List</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Popup for Search Result Details */}
            {isPopupOpen && selectedItem && (
                <div className="popup-overlay" onClick={() => setIsPopupOpen(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedItem.title}</h2>
                        {selectedItem.coverImage && <img src={selectedItem.coverImage} alt={selectedItem.title} />}
                        <p>{selectedItem.description ? selectedItem.description.replace(/<\/?[^>]+(>|$)/g, "") : 'No description available.'}</p>
                        {selectedItem.episodes && <p>Episodes: {selectedItem.episodes}</p>}
                        {selectedItem.genres && selectedItem.genres.length > 0 && <p>Genres: {selectedItem.genres.join(', ')}</p>}
                        {selectedItem.author_name && selectedItem.author_name.length > 0 && <p>Author(s): {selectedItem.author_name.join(', ')}</p>}
                        {selectedItem.publish_year && <p>First Published: {selectedItem.publish_year}</p>}
                        {selectedItem.release_date && <p>Release Date: {selectedItem.release_date}</p>}
                        <button onClick={() => handleAddFromSearch(selectedItem)}>Add to List</button>
                        <button onClick={() => setIsPopupOpen(false)}>Close</button>
                    </div>
                </div>
            )}

            {/* Main Media List */}
            <div className="media-list">
                {/* Column Headers */}
                <div className="media-entry media-entry-header">
                    <div className="media-entry-id">No.</div>
                    <div className="media-entry-title">Title</div>
                    <div className="media-entry-score">Score</div>
                    <div className="media-entry-type">Type</div>
                    <div className="media-entry-status">Status</div>
                    <div className="media-entry-progress">Progress</div>
                    <div className="media-entry-comment">Comment</div>
                    <div className="media-entry-actions">Actions</div>
                </div>
                {mediaList.map((entry, index) => (
                    <MediaEntry
                        key={entry.id}
                        index={index}
                        id={entry.id}
                        title={entry.title}
                        score={entry.score}
                        media_type={entry.media_type}
                        status={entry.status}
                        progress={entry.progress}
                        comment={entry.comment}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
};

export default MediaList;
