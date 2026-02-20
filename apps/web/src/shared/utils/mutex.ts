export class Mutex {
    private _queue: Array<() => void> = [];
    private _locked = false;

    private _release() {
        this._locked = false;
        this._queue.shift()?.();
    }

    acquire(): Promise<() => void> {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                if (!this._locked) {
                    this._locked = true;
                    resolve(() => this._release());
                } else {
                    this._queue.push(tryAcquire);
                }
            };
            tryAcquire();
        });
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        const release = await this.acquire();
        try { return await fn(); } finally { release(); }
    }
}
