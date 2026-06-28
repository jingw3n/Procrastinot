"""
Unit tests for utility functions (no DB or API needed).
"""
from app.routes.canvas import strip_html

def test_strip_html_basic():
    assert strip_html("<p>Hello world</p>") == "Hello world"

def test_strip_html_nested():
    assert strip_html("<div><strong>Bold</strong> text</div>") == "Bold text"

def test_strip_html_entities():
    assert strip_html("A &amp; B") == "A & B"
    assert strip_html("&lt;tag&gt;") == "<tag>"
    assert strip_html("Hello&nbsp;World") == "Hello World"

def test_strip_html_empty():
    assert strip_html("") is None
    assert strip_html(None) is None

def test_strip_html_no_tags():
    assert strip_html("Plain text") == "Plain text"

def test_strip_html_whitespace_collapse():
    assert strip_html("<p>Hello   </p><p>   World</p>") == "Hello World"
