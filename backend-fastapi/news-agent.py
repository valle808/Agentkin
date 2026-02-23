import requests
from bs4 import BeautifulSoup
import time
from collections import defaultdict

class NewsAgent:
    def __init__(self, sources):
        self.sources = sources
        self.articles = defaultdict(list)

    def scrape_news(self):
        for source in self.sources:
            response = requests.get(source)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                for article in soup.find_all('article'):
                    title = article.find('h2').text
                    link = article.find('a')['href']
                    self.articles[title].append(link)

    def deduplicate_articles(self):
        return {title: links[0] for title, links in self.articles.items()}

    def generate_news_article(self, deduped_articles):
        # Generate a structured news article
        article_content = ""
        for title, link in deduped_articles.items():
            article_content += f"{title}\nRead more at: {link}\n\n"
        return article_content

    def run(self):
        while True:
            self.scrape_news()
            deduped_articles = self.deduplicate_articles()
            news_article = self.generate_news_article(deduped_articles)
            print(news_article)
            time.sleep(60)  # Wait for 1 minute

# Example usage:
if __name__ == '__main__':
    news_sources = ['https://example.com/news', 'https://anotherexample.com/news']
    agent = NewsAgent(news_sources)
    agent.run()