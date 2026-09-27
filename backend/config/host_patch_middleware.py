class BypassHostCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.get_host = lambda: request.META.get('HTTP_HOST') or request.META.get('SERVER_NAME')
        return self.get_response(request)
