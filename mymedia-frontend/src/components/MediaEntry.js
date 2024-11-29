import React from 'react';
import '../style/MediaEntry.css';

const MediaEntry = ({ index, id, title, score, media_type, status, progress, comment, onEdit, onDelete }) => {
    console.log("MediaEntry Props:", { index, id, title, score, media_type, status, progress, comment });
    return (
        <div className="media-entry">
            <div className="media-entry-id">{index + 1}</div>
            <div className="media-entry-title">
                <h3>{title || 'Untitled'}</h3>
            </div>
            <div className="media-entry-score">{score !== null && score !== undefined ? score : '-'}</div>
            <div className="media-entry-type">{media_type || '-'}</div>
            <div className="media-entry-status">{status || '-'}</div>
            <div className="media-entry-progress">{progress || '-'}</div>
            <div className="media-entry-comment">{comment || 'No comments'}</div>
            <div className="media-entry-actions">
                <button className="edit-button" onClick={() => onEdit(id)}>Edit</button>
                <button className="delete-button" onClick={() => onDelete(id)}>Delete</button>
            </div>
        </div>
    );
};

export default MediaEntry;
