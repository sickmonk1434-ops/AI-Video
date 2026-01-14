export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="footer-col">
                    <div className="logo">VideoCreator</div>
                    <p className="footer-desc">
                        Empowering creators with AI-driven video tools.
                    </p>
                </div>
                <div className="footer-links">
                    <div className="col">
                        <h4>Product</h4>
                        <a href="#">Features</a>
                        <a href="#">Pricing</a>
                    </div>
                    <div className="col">
                        <h4>Company</h4>
                        <a href="#">About</a>
                        <a href="#">Blog</a>
                    </div>
                </div>
            </div>
            <div className="container footer-bottom">
                <p>&copy; {new Date().getFullYear()} VideoCreator. All rights reserved.</p>
            </div>

        </footer>
    );
}
