from flask import Flask, render_template_string, send_from_directory, redirect
import markdown
import os
import glob

app = Flask(__name__)

# 配置文档目录
DOCS_DIR = '/root/clawd/docs'
os.makedirs(DOCS_DIR, exist_ok=True)

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }} - 文档中心</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 1.5rem; }
        .container {
            display: flex;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            gap: 20px;
        }
        .sidebar {
            width: 280px;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            height: fit-content;
            position: sticky;
            top: 20px;
        }
        .sidebar h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        .file-list {
            list-style: none;
        }
        .file-list li {
            margin-bottom: 8px;
        }
        .file-list a {
            color: #333;
            text-decoration: none;
            display: block;
            padding: 8px 12px;
            border-radius: 6px;
            transition: all 0.3s;
        }
        .file-list a:hover, .file-list a.active {
            background: #667eea;
            color: white;
        }
        .content {
            flex: 1;
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .content h1 { color: #667eea; margin-bottom: 20px; }
        .content h2 { color: #764ba2; margin: 30px 0 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
        .content h3 { color: #555; margin: 20px 0 10px; }
        .content p { line-height: 1.8; margin-bottom: 15px; color: #444; }
        .content ul, .content ol { margin: 15px 0; padding-left: 25px; }
        .content li { margin-bottom: 8px; line-height: 1.6; }
        .content code {
            background: #f4f4f4;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Consolas', monospace;
            color: #e83e8c;
        }
        .content pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
        }
        .content pre code {
            background: none;
            color: inherit;
            padding: 0;
        }
        .content blockquote {
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin: 20px 0;
            color: #666;
            font-style: italic;
        }
        .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .content th, .content td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .content th {
            background: #667eea;
            color: white;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        .empty-state h2 { color: #667eea; margin-bottom: 15px; border: none; }
        @media (max-width: 768px) {
            .container { flex-direction: column; }
            .sidebar { width: 100%; position: static; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 文档中心</h1>
    </div>
    <div class="container">
        <aside class="sidebar">
            <h3>📄 文档列表</h3>
            <ul class="file-list">
                {% for file in files %}
                <li>
                    <a href="/doc/{{ file }}" class="{% if file == current_file %}active{% endif %}">
                        {{ file.replace('.md', '') }}
                    </a>
                </li>
                {% endfor %}
            </ul>
        </aside>
        <main class="content">
            {{ content | safe }}
        </main>
    </div>
</body>
</html>
'''

def get_md_files():
    """获取所有markdown文件"""
    files = []
    if os.path.exists(DOCS_DIR):
        for f in sorted(os.listdir(DOCS_DIR)):
            if f.endswith('.md'):
                files.append(f)
    return files

@app.route('/')
def index():
    files = get_md_files()
    if files:
        # 重定向到第一个文档
        return redirect(f'/doc/{files[0]}')
    
    # 显示空状态
    content = '''
    <div class="empty-state">
        <h2>📭 暂无文档</h2>
        <p>请将Markdown文件放入 <code>/root/clawd/docs</code> 目录</p>
        <p>文件会自动显示在左侧列表中</p>
    </div>
    '''
    return render_template_string(HTML_TEMPLATE, 
                                  title='首页', 
                                  content=content, 
                                  files=[],
                                  current_file='')

@app.route('/doc/<filename>')
def show_doc(filename):
    files = get_md_files()
    
    if not filename.endswith('.md'):
        filename += '.md'
    
    filepath = os.path.join(DOCS_DIR, filename)
    
    if not os.path.exists(filepath):
        content = f'<h1>❌ 文档不存在</h1><p>找不到文件: {filename}</p>'
    else:
        with open(filepath, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # 转换markdown为HTML
        md = markdown.Markdown(extensions=['fenced_code', 'tables', 'toc'])
        html_content = md.convert(md_content)
        content = html_content
    
    return render_template_string(HTML_TEMPLATE,
                                  title=filename.replace('.md', ''),
                                  content=content,
                                  files=files,
                                  current_file=filename)

@app.route('/api/files')
def api_files():
    """API: 获取文件列表"""
    return {'files': get_md_files()}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
