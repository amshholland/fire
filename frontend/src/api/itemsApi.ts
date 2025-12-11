export const fetchItems = async () => {
    const response = await fetch('/api/items');
    if (!response.ok) {
        throw new Error('Failed to fetch items');
    }
    return response.json();
};

export const createItem = async (name: any) => {
    const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        throw new Error('Failed to create item');
    }
    return response.json();
};